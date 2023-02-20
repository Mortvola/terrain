#version 300 es

in highp vec4 aVertexPosition;

layout (std140) uniform Matrices
{
    highp mat4 projection;
    highp mat4 view;
};
uniform highp mat4 uModelMatrix;

void main()
{
    gl_Position = projection * view * uModelMatrix * aVertexPosition;
}  
