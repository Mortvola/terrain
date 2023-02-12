import { vec3, mat4, vec4 } from 'gl-matrix';
import TerrainTile, { TerrainRendererInterface, Location, tileDimension } from './TerrainTile';
import LatLng from '../LatLng';
import {
  degToRad, latLngToMercator, latLngToTerrainTile, radToDeg, terrainTileToLatLng,
} from '../utilities';
import TerrainShader from './Shaders/TerrainShader';
import PhotoShader from './Shaders/PhotoShader';
import Photo from './Photo';
import { PhotoInterface } from '../PhotoInterface';
import CubeMap from './Skybox';

type Tile = {
  offset: { x: number, y: number},
  tile: TerrainTile | null,
}

const cameraZOffset = 2;

const requestPostAnimationFrame = (task: (timestamp: number) => void) => {
  requestAnimationFrame((timestamp: number) => {
    setTimeout(() => {
      task(timestamp);
    }, 0);
  });
};

const tilePadding = 4;

class TerrainRenderer implements TerrainRendererInterface {
  gl: WebGL2RenderingContext;

  tileServerUrl: string;

  tileGrid: Tile[][] = [];

  tileRenderOrder: { x: number, y: number }[] = [];

  tileMap: Map<string, TerrainTile> = new Map();

  position: LatLng;

  cameraOffset: vec3 = vec3.fromValues(0, 0, 0);

  cameraFront: vec3 = vec3.fromValues(1, 0, 0);

  velocity = 1.1176 * 10; // meters per second

  moveDirection: vec3 = vec3.create();

  previousTimestamp: number | null = null;

  pitch = 0;

  yaw = 0;

  fogNormalizationFactor = 0;

  fogColor: vec4 = [1.0, 1.0, 1.0, 1.0];

  terrainShader: TerrainShader;

  photoShader: PhotoShader;

  startFpsTime: number | null = null;

  framesRendered = 0;

  #render = false;

  onFpsChange: (fps: number) => void;

  onLoadChange: (percentComplete: number) => void;

  photoUrl?: string;

  photoData?: PhotoInterface | null = null;

  editPhoto? = false;

  photo: Photo | null = null;

  photoAlpha = 1;

  fadePhoto = false;

  fadeSTartTime: number | null = null;

  photoFadeDuration = 2;

  photoLoaded = false;

  terrainLoaded = false;

  scale = 1;

  skybox: CubeMap;

  constructor(
    gl: WebGL2RenderingContext,
    position: LatLng,
    tileServerUrl: string,
    onFpsChange: (fps: number) => void,
    onLoadChange: (percentComplete: number) => void,
    photoUrl?: string,
    photoData?: null | PhotoInterface,
    editPhoto?: boolean,
  ) {
    this.gl = gl;
    this.tileServerUrl = tileServerUrl;
    this.position = position;
    this.onFpsChange = onFpsChange;
    this.onLoadChange = onLoadChange;
    this.photoUrl = photoUrl;
    this.photoData = photoData;
    this.editPhoto = editPhoto;

    // Only continue if WebGL is available and working
    // Set clear color to black, fully opaque
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.enable(this.gl.CULL_FACE);

    this.terrainShader = new TerrainShader(this.gl);

    this.photoShader = new PhotoShader(this.gl);

    this.skybox = new CubeMap(this.gl);

    this.initialize();
  }

  async initialize(): Promise<void> {
    this.initTileGrid();

    const [x, y] = latLngToTerrainTile(this.position.lat, this.position.lng, tileDimension);
    const latLngCenter = terrainTileToLatLng(x, y, tileDimension);

    this.scale = Math.cos(degToRad(latLngCenter.lat));

    this.initCamera(x, y, latLngCenter);
    this.loadPhoto(x, y, latLngCenter);
    this.lookAtPhoto();

    await this.loadTiles(x, y);
    await this.skybox.load();

    this.initCamera(x, y, latLngCenter);
    this.updatePhotoElevation(x, y, latLngCenter);
    this.lookAtPhoto();

    // Use the padding width to set the fog normalization factor
    // so that the far edge of the tiled area is completely occluded by
    // the fog.
    const { tile } = this.tileGrid[tilePadding][tilePadding];
    const fogFar = (tile?.xDimension ?? 1) * tilePadding;
    this.fogNormalizationFactor = 0; // 1 / (2 ** (fogFar * (Math.LOG2E / 4096.0)) - 1.0);
  }

  initTileGrid(): void {
    const gridDimension = tilePadding * 2 + 1;

    for (let y = 0; y < gridDimension; y += 1) {
      const row = [];

      for (let x = 0; x < gridDimension; x += 1) {
        const offsetX = 0; // (x - tilePadding) * TerrainTile.xDimension;
        const offsetY = 0; // -(y - tilePadding) * TerrainTile.yDimension;

        row.push({ offset: { x: offsetX, y: offsetY }, tile: null });
        this.tileRenderOrder.push({ x, y });
      }

      this.tileGrid.push(row);
    }

    this.tileRenderOrder.sort((a, b) => (
      (Math.abs(a.x - tilePadding) + Math.abs(a.y - tilePadding))
      - (Math.abs(b.x - tilePadding) + Math.abs(b.y - tilePadding))
    ));
  }

  initCamera(x: number, y: number, latLngCenter: LatLng): void {
    this.updateLookAt(0, 0);

    let [xOffset, yOffset] = this.getCameraOffset(latLngCenter);

    if (this.photoData) {
      xOffset += this.photoData.translation[0];
      yOffset += this.photoData.translation[1];
    }

    const { tile } = this.tileGrid[tilePadding][tilePadding];

    const zOffset = (tile?.getElevation(xOffset, yOffset) ?? 0) + cameraZOffset;

    this.cameraOffset = [
      xOffset,
      yOffset,
      zOffset,
    ];
  }

  lookAtPhoto(): void {
    if (this.photo) {
      const cameraOffset = vec3.multiply(
        vec3.create(), this.cameraOffset, vec3.fromValues(this.scale, this.scale, 1),
      );
      const cameraFront = vec3.subtract(vec3.create(), this.photo.center, cameraOffset);

      vec3.normalize(this.cameraFront, cameraFront);

      this.yaw = radToDeg(Math.atan2(this.cameraFront[1], this.cameraFront[0]));
      this.pitch = radToDeg(Math.asin(this.cameraFront[2]));
    }
  }

  async loadTiles(x: number, y: number): Promise<void> {
    const totalTiles = (tilePadding * 2 + 1) ** 2;
    let tilesLoaded = 0;
    const promises: Promise<void | void[]>[] = [];

    for (let y2 = -tilePadding; y2 <= tilePadding; y2 += 1) {
      for (let x2 = -tilePadding; x2 <= tilePadding; x2 += 1) {
        promises.push(
          this.loadTile(
            x2 + tilePadding,
            y2 + tilePadding,
            { x: x + x2, y: y - y2, dimension: tileDimension },
          )
            // eslint-disable-next-line no-loop-func
            .then(() => {
              tilesLoaded += 1;
              const percentComplete = tilesLoaded / totalTiles;
              this.onLoadChange(percentComplete);

              if (percentComplete >= 1) {
                this.terrainLoaded = true;
                this.fadePhoto = !this.editPhoto;
              }
            }),
        );
      }
    }

    await Promise.all(promises);

    this.setTileGridOffsets();
  }

  setTileRowOffsets(y: number, yOffset: number): void {
    for (let x = 1; x <= tilePadding; x += 1) {
      let prevTile = this.tileGrid[y][tilePadding + x - 1];
      let currentTile = this.tileGrid[y][tilePadding + x];

      if (prevTile.tile && currentTile.tile) {
        currentTile.offset.x = prevTile.offset.x
          + (prevTile.tile.xDimension + currentTile.tile.xDimension) / 2;
        currentTile.offset.y = yOffset;
      }

      prevTile = this.tileGrid[y][tilePadding - x + 1];
      currentTile = this.tileGrid[y][tilePadding - x];

      if (prevTile.tile && currentTile.tile) {
        currentTile.offset.x = prevTile.offset.x
          - (prevTile.tile.xDimension + currentTile.tile.xDimension) / 2;
        currentTile.offset.y = yOffset;
      }
    }
  }

  setTileGridOffsets(): void {
    this.setTileRowOffsets(tilePadding, 0);

    for (let y = 1; y <= tilePadding; y += 1) {
      let prevTile = this.tileGrid[tilePadding + y - 1][tilePadding];
      const currentTile1 = this.tileGrid[tilePadding + y][tilePadding];

      if (prevTile.tile && currentTile1.tile) {
        currentTile1.offset.x = 0;
        currentTile1.offset.y = prevTile.offset.y
          - (prevTile.tile.yDimension + currentTile1.tile.yDimension) / 2;
      }

      prevTile = this.tileGrid[tilePadding - y + 1][tilePadding];
      const currentTile2 = this.tileGrid[tilePadding - y][tilePadding];

      if (prevTile.tile && currentTile2.tile) {
        currentTile2.offset.x = 0;
        currentTile2.offset.y = prevTile.offset.y
          + (prevTile.tile.yDimension + currentTile2.tile.yDimension) / 2;
      }

      for (let x = 1; x <= tilePadding; x += 1) {
        this.setTileRowOffsets(tilePadding + y, currentTile1.offset.y);
        this.setTileRowOffsets(tilePadding - y, currentTile2.offset.y);
      }
    }
  }

  handlePhotoLoaded(): void {
    this.photoLoaded = true;
  }

  loadPhoto(x: number, y: number, latLngCenter: LatLng): void {
    if (this.photoData) {
      const centerTile = this.tileGrid[tilePadding][tilePadding].tile;

      const [xOffset, yOffset] = this.getCameraOffset(latLngCenter);

      const zOffset = (centerTile?.getElevation(
        xOffset + this.photoData.translation[0],
        yOffset + this.photoData.translation[1],
      ) ?? 0) + cameraZOffset;

      if (!this.photoUrl) {
        throw new Error('photoUrl not defined');
      }

      this.photo = new Photo(
        this.photoData,
        this.photoUrl,
        this.gl,
        this.photoShader,
        xOffset,
        yOffset,
        zOffset,
        this.scale,
        this.handlePhotoLoaded.bind(this),
      );
    }
  }

  getCameraOffset(latLngCenter: LatLng): [number, number] {
    const positionMerc = latLngToMercator(this.position.lat, this.position.lng);
    const centerMerc = latLngToMercator(latLngCenter.lat, latLngCenter.lng);

    return [
      positionMerc[0] - centerMerc[0],
      positionMerc[1] - centerMerc[1],
    ];
  }

  updatePhotoElevation(x: number, y: number, latLngCenter: LatLng): void {
    if (this.photo) {
      const centerTile = this.tileGrid[tilePadding][tilePadding].tile;

      const [xOffset, yOffset] = this.getCameraOffset(latLngCenter);

      this.photo.zOffset = (centerTile?.getElevation(
        xOffset + this.photo.photoData.translation[0],
        yOffset + this.photo.photoData.translation[1],
      ) ?? 0) + cameraZOffset;
      this.photo.makeTransform();
    }
  }

  centerPhoto(): void {
    if (this.photo) {
      this.photo.setRotation(null, this.pitch, this.yaw);
    }
  }

  setPhotoAlpha(alpha: number): void {
    this.photoAlpha = Math.max(Math.min(alpha, 1), 0);
  }

  async loadTile(
    x: number,
    y: number,
    location: Location,
  ): Promise<void | void[]> {
    const locationKey = (loc: Location): string => (
      `${loc.x}-${loc.y}`
    );

    let tile = this.tileMap.get(locationKey(location));

    if (!tile) {
      tile = new TerrainTile(this, location);
      this.tileMap.set(locationKey(location), tile);

      this.tileGrid[y][x].tile = tile;

      return tile.load(this.terrainShader);
    }

    this.tileGrid[y][x].tile = tile;

    return Promise.resolve();
  }

  start(): void {
    const draw = (timestamp: number) => {
      if (this.#render) {
        if (timestamp !== this.previousTimestamp) {
          if (this.startFpsTime === null) {
            this.startFpsTime = timestamp;
          }

          // Update the fps display every second.
          const fpsElapsedTime = timestamp - this.startFpsTime;

          if (fpsElapsedTime > 1000) {
            const fps = this.framesRendered / (fpsElapsedTime * 0.001);
            this.onFpsChange(fps);
            this.framesRendered = 0;
            this.startFpsTime = timestamp;
          }

          // Move the camera using the set velocity.
          if (this.previousTimestamp !== null) {
            const elapsedTime = (timestamp - this.previousTimestamp) * 0.001;

            this.updateCameraPosition(elapsedTime);

            if (this.fadePhoto && this.photoAlpha > 0) {
              if (this.fadeSTartTime === null) {
                this.fadeSTartTime = timestamp;
              }
              else {
                const eTime = (timestamp - this.fadeSTartTime) * 0.001;
                this.photoAlpha = 1 - eTime / this.photoFadeDuration;
                if (this.photoAlpha < 0) {
                  this.photoAlpha = 0;
                  this.fadePhoto = false;
                }
              }
            }
          }

          this.previousTimestamp = timestamp;

          this.drawScene();

          this.framesRendered += 1;
        }

        requestPostAnimationFrame(draw);
      }
    };

    if (!this.#render) {
      requestPostAnimationFrame(draw);
      this.#render = true;
    }
  }

  stop(): void {
    this.#render = false;
  }

  updateCameraPosition(elapsedTime: number): void {
    if (
      this.moveDirection[0] !== 0
      || this.moveDirection[1] !== 0
      || this.moveDirection[2] !== 0
    ) {
      const { tile } = this.tileGrid[tilePadding][tilePadding];

      if (tile) {
        const newCameraOffset = vec3.create();
        const velocity = vec3.create();
        const direction = vec3.create();

        vec3.normalize(direction, this.moveDirection);
        vec3.rotateZ(direction, direction, vec3.create(), degToRad(this.yaw));

        vec3.scale(velocity, direction, this.velocity * elapsedTime);
        vec3.add(newCameraOffset, this.cameraOffset, velocity);

        // If we have crossed over a tile boundary then...
        if (newCameraOffset[0] > (tile.xDimension / 2)
          || newCameraOffset[0] < -(tile.xDimension / 2)
          || newCameraOffset[1] > (tile.yDimension / 2)
          || newCameraOffset[1] < -(tile.yDimension / 2)
        ) {
          const gridX = Math.floor(
            (newCameraOffset[0] + (tile.xDimension / 2)) / tile.xDimension,
          );

          const gridY = Math.floor(
            (newCameraOffset[1] + (tile.xDimension / 2)) / tile.yDimension,
          );

          const { tile: newCenterTile } = this.tileGrid[
            tilePadding - gridY
          ][
            tilePadding + gridX
          ];

          if (!newCenterTile) {
            throw new Error('new center tile is null');
          }

          this.loadTiles(newCenterTile.location.x, newCenterTile.location.y);

          newCameraOffset[0] -= gridX * tile.xDimension;
          newCameraOffset[1] -= gridY * tile.yDimension;
        }

        // If the camera x/y position has changed then updated the elevation (z).
        if (newCameraOffset[0] !== this.cameraOffset[0]
          || newCameraOffset[1] !== this.cameraOffset[1]) {
          [this.cameraOffset[0], this.cameraOffset[1]] = newCameraOffset;

          try {
            this.cameraOffset[2] = tile.getElevation(
              this.cameraOffset[0],
              this.cameraOffset[1],
            ) + cameraZOffset;

            if (this.editPhoto) {
              this.photo?.setTranslation(
                (this.cameraOffset[0] - this.photo.xOffset) * this.scale,
                (this.cameraOffset[1] - this.photo.yOffset) * this.scale,
                this.cameraOffset[2] - 0, // this.photo.zOffset,
              );
            }
          }
          catch (error) {
            console.log(`newCameraOffset = [${newCameraOffset[0]}, ${newCameraOffset[1]}]`);
          }
        }
      }
    }
  }

  updateLookAt(yawChange: number, pitchChange: number): void {
    this.yaw += yawChange;
    this.pitch += pitchChange;

    this.pitch = Math.max(Math.min(this.pitch, 89), -89);

    const cameraFront = vec3.fromValues(1, 0, 0);

    vec3.rotateY(cameraFront, cameraFront, vec3.create(), degToRad(this.pitch));
    vec3.rotateZ(cameraFront, cameraFront, vec3.create(), degToRad(this.yaw));

    this.cameraFront = cameraFront;
  }

  setVelocity(x: number | null, y: number | null, z: number | null): void {
    if (x !== null) {
      this.moveDirection[0] = x;
    }

    if (y !== null) {
      this.moveDirection[1] = y;
    }

    if (z !== null) {
      this.moveDirection[2] = z;
    }
  }

  drawScene(capturePhoto = false): void {
    if (capturePhoto && this.photo) {
      this.gl.canvas.width = (this.photo.image.width / this.photo.image.height)
        * this.gl.canvas.height;
    }
    else {
      this.gl.canvas.width = (this.gl.canvas.clientWidth / this.gl.canvas.clientHeight)
        * this.gl.canvas.height;
    }

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    let projectionMatrix: mat4;

    if (capturePhoto && this.photo) {
      projectionMatrix = this.getProjectionMatrix(36.315746016);
    }
    else {
      projectionMatrix = this.getProjectionMatrix(45);
    }
    const viewMatrix = this.getViewMatrix();

    // Clear the canvas before we start drawing on it.
    // eslint-disable-next-line no-bitwise
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LESS); // Near things obscure far things
    this.gl.disable(this.gl.BLEND);

    this.drawTerrain(projectionMatrix, viewMatrix);

    if (!capturePhoto) {
      this.drawPhoto(projectionMatrix, viewMatrix);
    }

    this.skybox.draw(projectionMatrix, viewMatrix);
  }

  drawTerrain(
    projectionMatrix: mat4,
    viewMatrix: mat4,
  ): void {
    if (/*this.photoLoaded && */this.terrainLoaded) {
      const lightVector = vec3.fromValues(0, -1, -1);
      vec3.normalize(lightVector, lightVector);

      this.terrainShader.use();
      this.terrainShader.setProjection(projectionMatrix);
      this.terrainShader.setView(viewMatrix);
      this.terrainShader.setLightVector(lightVector);
      this.terrainShader.setFog(this.fogColor, this.fogNormalizationFactor)

      this.tileRenderOrder.forEach((order) => {
        const { tile, offset } = this.tileGrid[order.y][order.x];

        if (tile) {
          const modelMatrix = this.getModelMatrix(
            offset.x,
            offset.y,
            0,
          );

          tile.draw(projectionMatrix, viewMatrix, modelMatrix, this.terrainShader);
        }
      });

      // Disable depth test when rendering transparent components.
      this.gl.disable(this.gl.DEPTH_TEST);

      // Draw Transparent
      this.tileRenderOrder.forEach((order) => {
        const { tile, offset } = this.tileGrid[order.y][order.x];

        if (tile) {
          const modelMatrix = this.getModelMatrix(
            offset.x,
            offset.y,
            0,
          );

          tile.drawTransparent(projectionMatrix, viewMatrix, modelMatrix, this.terrainShader);
        }
      });

      this.gl.enable(this.gl.DEPTH_TEST);
    }
  }

  drawPhoto(
    projectionMatrix: mat4,
    viewMatrix: mat4,
  ): void {
    if (this.photo && this.photoAlpha > 0) {
      this.photoShader.use();

      this.gl.uniformMatrix4fv(
        this.photoShader.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
      );

      this.gl.uniformMatrix4fv(
        this.photoShader.uniformLocations.viewMatrix,
        false,
        viewMatrix,
      );

      if (this.terrainLoaded) {
        this.gl.blendColor(1, 1, 1, this.photoAlpha);
        this.gl.blendFunc(this.gl.CONSTANT_ALPHA, this.gl.ONE_MINUS_CONSTANT_ALPHA);
        this.gl.enable(this.gl.BLEND);
      }
      else {
        this.gl.disable(this.gl.BLEND);
      }

      this.gl.uniformMatrix4fv(
        this.photoShader.uniformLocations.modelMatrix,
        false,
        this.photo.transform,
      );

      this.photo.draw();
    }
  }

  getProjectionMatrix(fieldOfView: number): mat4 {
    // Set up the projection matrix
    const aspect = this.gl.canvas.width / this.gl.canvas.height;
    const projectionMatrix = mat4.create();

    const zNear = 1;
    const zFar = 16000.0;

    mat4.perspective(projectionMatrix,
      degToRad(fieldOfView),
      aspect,
      zNear,
      zFar);

    return projectionMatrix;
  }

  getViewMatrix(): mat4 {
    const cameraOffset = vec3.multiply(
      vec3.create(),
      this.cameraOffset,
      vec3.fromValues(this.scale, this.scale, 1),
    );

    const cameraTarget = vec3.fromValues(
      this.cameraFront[0] + cameraOffset[0],
      this.cameraFront[1] + cameraOffset[1],
      this.cameraFront[2] + cameraOffset[2],
    );

    const cameraUp = vec3.rotateX(
      vec3.create(),
      vec3.fromValues(0.0, 0.0, 1.0),
      vec3.create(),
      degToRad(0.7),
    );

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, cameraOffset, cameraTarget, cameraUp);

    return viewMatrix;
  }

  getModelMatrix(xOffset: number, yOffset: number, zOffset: number): mat4 {
    // const { startLatOffset, startLngOffset } = getStartOffset(this.position);

    const modelMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.translate(
      modelMatrix,
      modelMatrix,
      vec3.fromValues(xOffset * this.scale, yOffset * this.scale, zOffset),
    );
    mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(this.scale, this.scale, 1));
    return modelMatrix;
  }

  setScale(scale: number): void {
    this.scale = scale;
    if (this.photo) {
      this.photo.setScale(scale);
    }
  }

  // async capture(): Promise<string> {
  //   return new Promise<string>((resolve) => {
  //     this.drawScene(true);
  //     this.gl.canvas.toBlob((blob) => {
  //       if (blob) {
  //         const url = URL.createObjectURL(blob);
  //         resolve(url);
  //       }
  //     });
  //   });
  // }
}

export default TerrainRenderer;
