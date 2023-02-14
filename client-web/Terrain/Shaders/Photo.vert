#version 300 es

in vec4 aVertexPosition;
in vec2 aTexCoord;

layout (std140) uniform Matrices
{
    highp mat4 projection;
    highp mat4 view;
};
uniform highp mat4 uModelMatrix;

out highp vec2 vTexCoord;

void main() {
  highp vec4 position = view * uModelMatrix * aVertexPosition;

  gl_Position = projection * position;
  vTexCoord = aTexCoord;
}
