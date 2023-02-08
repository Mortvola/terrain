import { compileProgram, loadShader } from './Common';
import terrainVertex from './Terrain.vert';
import terrainFragment from './Terrain.frag';

class TerrainShader {
  gl: WebGL2RenderingContext;

  shaderProgram: WebGLProgram | null = null;

  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null,
    viewMatrix: WebGLUniformLocation | null,
    modelMatrix: WebGLUniformLocation | null,
    fogColor: WebGLUniformLocation | null,
    fogNormalizationFactor: WebGLUniformLocation | null,
    lightVector: WebGLUniformLocation | null,
  } = {
      projectionMatrix: null,
      viewMatrix: null,
      modelMatrix: null,
      fogColor: null,
      fogNormalizationFactor: null,
      lightVector: null,
    };

  attribLocations: {
    vertexPosition: number | null,
    texCoord: number | null,
    vertexNormal: number | null,
  } = { vertexPosition: null, texCoord: null, vertexNormal: null };

  constructor(gl:WebGL2RenderingContext) {
    this.gl = gl;

    const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, terrainVertex);

    if (vertexShader === null) {
      throw new Error('vertexShader is null');
    }

    const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, terrainFragment);

    if (fragmentShader === null) {
      throw new Error('fragmentShader is null');
    }

    this.shaderProgram = compileProgram(this.gl, vertexShader, fragmentShader);

    if (this.shaderProgram === null) {
      throw new Error('shaderProgram is null');
    }

    this.uniformLocations.projectionMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');

    if (this.uniformLocations.projectionMatrix === null) {
      throw new Error('projectionMatrix is null');
    }

    this.uniformLocations.viewMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uViewMatrix');

    if (this.uniformLocations.viewMatrix === null) {
      throw new Error('viewMatrix is null');
    }

    this.uniformLocations.modelMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uModelMatrix');

    if (this.uniformLocations.modelMatrix === null) {
      throw new Error('modelMatrix is null');
    }

    this.uniformLocations.fogColor = this.gl.getUniformLocation(this.shaderProgram, 'uFogColor');

    if (this.uniformLocations.fogColor === null) {
      throw new Error('uFogColor is null');
    }

    this.uniformLocations.fogNormalizationFactor = this.gl.getUniformLocation(this.shaderProgram, 'uFogNormalizationFactor');

    if (this.uniformLocations.fogNormalizationFactor === null) {
      throw new Error('uFogNormalizationFactor is null');
    }

    this.uniformLocations.lightVector = this.gl.getUniformLocation(this.shaderProgram, 'uLightVector');

    if (this.uniformLocations.lightVector === null) {
      throw new Error('lightVector is null');
    }

    this.attribLocations.vertexPosition = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.attribLocations.texCoord = this.gl.getAttribLocation(this.shaderProgram, 'aTexCoord');
    this.attribLocations.vertexNormal = this.gl.getAttribLocation(this.shaderProgram, 'aVertexNormal');
  }
}

export default TerrainShader;
