#version 300 es

in vec3 aVertexPosition;
in vec2 aTexCoord;
in vec3 aVertexNormal;
in vec3 aTangent;

layout (std140) uniform Matrices
{
    highp mat4 projection;
    highp mat4 view;
};
uniform highp mat4 uModelMatrix;
uniform highp vec3 uLightVector;

out highp vec2 fsTexCoords;
out highp vec3 fsTangentLightVector;

void main() {
  gl_Position = projection * view * uModelMatrix * vec4(aVertexPosition, 1.0);;

  mat3 normalMatrix = transpose(inverse(mat3(uModelMatrix)));
  vec3 T = normalize(normalMatrix * aTangent);
  vec3 N = normalize(normalMatrix * aVertexNormal);
  T = normalize(T - dot(T, N) * N);
  vec3 B = cross(N, T);
  
  mat3 TBN = transpose(mat3(T, B, N));
  fsTangentLightVector = TBN * normalize(-uLightVector);
  fsTexCoords = aTexCoord;
}
