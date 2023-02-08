/* eslint-disable jsx-a11y/label-has-associated-control */
import React, {
  useEffect, useRef, useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { ProgressBar } from 'react-bootstrap';
import LatLng from '../LatLng';
import TerrainRenderer from './TerrainRenderer';
import styles from './Terrain.module.css';
import { PhotoInterface } from '../PhotoInterface';
import { metersToLocal } from '../utilities';

declare global {
  interface Window {
    showSaveFilePicker: () => any;
  }
}

type PropsType = {
  photoUrl?: string,
  photo?: null | PhotoInterface,
  editPhoto?: boolean,
  position: LatLng,
  tileServerUrl: string,
  onClose: () => void,
}

const Terrain: React.FC<PropsType> = observer(({
  photoUrl,
  photo,
  editPhoto,
  position,
  tileServerUrl,
  onClose,
}) => {
  const rendererRef = useRef<TerrainRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number, y: number} | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const [photoAlpha, setPhotoAlpha] = useState<number>(editPhoto ? 50 : 0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(853 / 480);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas !== null) {
      // Initialize the GL context
      const gl = canvas.getContext('webgl2');

      if (gl === null) {
        throw new Error('gl is null');
      }

      if (rendererRef.current === null) {
        rendererRef.current = new TerrainRenderer(
          gl, position, tileServerUrl, setFps, setPercentComplete, photoUrl, photo, editPhoto,
        );

        rendererRef.current.start();
      }
    }

    const renderer = rendererRef.current;
    return () => {
      if (renderer) {
        renderer.stop();
      }
    };
  }, [editPhoto, photo, photoUrl, position, tileServerUrl]);

  const handleCenterClick = () => {
    const renderer = rendererRef.current;

    if (renderer) {
      renderer.centerPhoto();
    }
  };

  const handleSaveClick = () => {
    photo?.save();
  };

  // const handleCaptureClick = async () => {
  //   const canvas = canvasRef.current;
  //   const renderer = rendererRef.current;

  //   if (canvas && renderer && renderer.photo) {
  //     const url = await renderer.capture();
  //     setImageUrl(url);
  //   }
  // };

  const getFloat = (v: string) => {
    if (v.match(/^[+-]?\d+(\.\d+)?$/)) {
      return parseFloat(v);
    }

    return Number.NaN;
  };

  const handleOffsetChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setOffset(value, null, null);
    }
  };

  const handleXRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setRotation(value, null, null);
    }
  };

  const handleYRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setRotation(null, value, null);
    }
  };

  const handleZRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setRotation(null, null, value);
    }
  };

  const handleXTranslationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setTranslation(value, null, null);
    }
  };

  const handleYTranslationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setTranslation(null, value, null);
    }
  };

  const handleZTranslationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setTranslation(null, value, null);
    }
  };

  const handleTransparencyChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const renderer = rendererRef.current;

    if (renderer) {
      const value = getFloat(event.target.value);
      if (!Number.isNaN(value)) {
        setPhotoAlpha(value);

        const alpha = value / 100;
        renderer.setPhotoAlpha(alpha);
      }
    }
  };

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (
    event: React.PointerEvent<HTMLCanvasElement> & {
      target: {
        setPointerCapture?: (id: number) => void,
      },
    },
  ) => {
    mouseRef.current = { x: event.clientX, y: event.clientY };
    if (event.target.setPointerCapture) {
      event.target.setPointerCapture(event.pointerId);
    }

    if (canvasRef.current) {
      canvasRef.current.focus();
    }

    event.stopPropagation();
    event.preventDefault();
  };

  const handlePointerMove: React.PointerEventHandler = (event) => {
    if (mouseRef.current) {
      const canvas = canvasRef.current;

      if (canvas) {
        const xOffset = event.clientX - mouseRef.current.x;
        const yOffset = -(event.clientY - mouseRef.current.y);
        const sensitivity = 0.1;

        const renderer = rendererRef.current;
        if (renderer !== null) {
          renderer.updateLookAt(xOffset * sensitivity, yOffset * sensitivity);
        }

        mouseRef.current = { x: event.clientX, y: event.clientY };

        event.stopPropagation();
        event.preventDefault();
      }
    }
  };

  const handlePointerUp: React.MouseEventHandler = (event) => {
    mouseRef.current = null;
    event.stopPropagation();
    event.preventDefault();
  };

  const handlePointerCapture: React.MouseEventHandler = (event) => {
    // console.log('got pointer capture');
  };

  const handlePointerRelease: React.MouseEventHandler = (event) => {
    // console.log('released pointer capture');
  };

  const handleKeyDown: React.KeyboardEventHandler = (event) => {
    const renderer = rendererRef.current;
    if (renderer) {
      switch (event.key) {
        case 'E':
        case 'e':
          renderer.setVelocity(1, null, null);
          break;

        case 'D':
        case 'd':
          renderer.setVelocity(-1, null, null);
          break;

        case 'S':
        case 's':
          renderer.setVelocity(null, 1, null);
          break;

        case 'F':
        case 'f':
          renderer.setVelocity(null, -1, null);
          break;

        case 'PageUp':
          // renderer.setVelocity(null, null, 1);
          renderer.updateLookAt(0, 1);
          break;

        case 'PageDown':
          // renderer.setVelocity(null, null, -1);
          renderer.updateLookAt(0, -1);
          break;

        default:
          break;
      }
    }

    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyUp: React.KeyboardEventHandler = (event) => {
    const renderer = rendererRef.current;
    if (renderer) {
      switch (event.key) {
        case 'E':
        case 'e':
          renderer.setVelocity(0, null, null);
          break;

        case 'D':
        case 'd':
          renderer.setVelocity(0, null, null);
          break;

        case 'F':
        case 'f':
          renderer.setVelocity(null, 0, null);
          break;

        case 'S':
        case 's':
          renderer.setVelocity(null, 0, null);
          break;

        case 'PageUp':
          renderer.setVelocity(null, null, 0);
          break;

        case 'PageDown':
          renderer.setVelocity(null, null, 0);
          break;

        default:
          break;
      }
    }

    event.preventDefault();
    event.stopPropagation();
  };

  const heading = (): string => {
    let degrees = (((rendererRef.current?.yaw ?? 0) - 90) % 360.0);
    if (degrees < 0) {
      degrees += 360;
    }
    degrees = 360 - degrees;

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    const direction = directions[Math.floor((degrees + 22.5) / 45)];

    return `${direction} (${degrees.toFixed(1)})`;
  };

  return (
    <div className={styles.terrain}>
      <div className={styles.upperLeft}>
        {
          percentComplete === 1
            ? (
              <>
                <div>{`${fps.toFixed(2)} fps`}</div>
                <div>{`${metersToLocal(rendererRef.current?.cameraOffset[2] ?? 0)}`}</div>
                <div>{`${heading()}`}</div>
              </>
            )
            : null
        }
      </div>
      <div className={styles.upperCenter}>
        {
          percentComplete !== 1
            ? (
              <div className={styles.progressBar}>
                <ProgressBar now={percentComplete} max={1} label={`${(percentComplete * 100).toFixed(2)}%`} />
              </div>
            )
            : null
        }
      </div>
      <div className={styles.upperRight}>
        <div className={`${styles.button} ${styles.right}`} onClick={onClose}>X</div>
        {
          photo && editPhoto
            ? (
              <div className={styles.controls}>
                <div className={styles.button} onClick={handleCenterClick}>Center</div>
                <label className={styles.labeledInput}>
                  Offset
                  <input type="text" onChange={handleOffsetChange} value={photo.offset[0].toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  X Rotation
                  <input type="text" onChange={handleXRotationChange} value={photo.xRotation.toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  Y Rotation
                  <input type="text" onChange={handleYRotationChange} value={photo.yRotation.toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  Z Rotation
                  <input type="text" onChange={handleZRotationChange} value={photo.zRotation.toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  X Translation
                  <input type="text" onChange={handleXTranslationChange} value={photo.translation[0].toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  Y Translation
                  <input type="text" onChange={handleYTranslationChange} value={photo.translation[1].toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  Z Translation
                  <input type="text" onChange={handleZTranslationChange} value={photo.translation[2].toFixed(2)} />
                </label>
                <div className={styles.button} onClick={handleSaveClick}>Save</div>
                <div
                  className={styles.button}
                  // onClick={handleCaptureClick}
                  >
                    Capture
                  </div>
              </div>
            )
            : null
          }
      </div>
      <div className={styles.bottomCenter}>
        <input type="range" className={styles.slider} onChange={handleTransparencyChange} min={0} max={100} value={photoAlpha.toFixed(2)} />
      </div>
      {
        imageUrl
          ? <img className={styles.snapshot} src={imageUrl} alt="" />
          : null
      }
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={480 * aspectRatio}
        height={480}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onGotPointerCapture={handlePointerCapture}
        onLostPointerCapture={handlePointerRelease}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      />
    </div>
  );
});

export default Terrain;
