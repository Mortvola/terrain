#version 300 es

in highp vec3 aPos;

uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uViewMatrix;

out highp vec3 TexCoords;

void main()
{
    TexCoords = aPos;
    highp vec4 pos = uProjectionMatrix * uViewMatrix * vec4(aPos, 1.0);
    gl_Position = pos.xyww;
}  
