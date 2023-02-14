#version 300 es

in highp vec3 aPos;

layout (std140) uniform Matrices
{
    highp mat4 projection;
    highp mat4 view;
};

out highp vec3 TexCoords;

void main()
{
    TexCoords = aPos;
    highp vec4 pos = projection * mat4(mat3(view)) * vec4(aPos, 1.0);
    gl_Position = pos.xyww;
}  
