#version 300 es

in vec4 aVertexPosition;
in vec2 aTexCoord;

uniform highp mat4 uModelMatrix;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;

out highp vec2 vTexCoord;

void main() {
  highp vec4 position = uViewMatrix * uModelMatrix * aVertexPosition;

  gl_Position = uProjectionMatrix * position;
  vTexCoord = aTexCoord;
}
