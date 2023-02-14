#version 300 es

in vec4 aVertexPosition;
in vec2 aTexCoord;
in vec3 aVertexNormal;

layout (std140) uniform Matrices
{
    highp mat4 projection;
    highp mat4 view;
};
uniform highp mat4 uModelMatrix;
uniform highp vec3 uLightVector;

out highp float fLighting;
out highp vec2 vTexCoord;
out highp vec3 vPosition;

void main() {
  highp vec4 position = view * uModelMatrix * aVertexPosition;

  gl_Position = projection * position;
  fLighting = 1.0 + min(dot(aVertexNormal, uLightVector), 0.0);
  vTexCoord = aTexCoord;
  vPosition = position.xyz;
}
