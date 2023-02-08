#version 300 es

in highp vec2 vTexCoord;

out highp vec4 FragColor;

uniform sampler2D photoTexture;

void main() {
  FragColor = texture(photoTexture, vTexCoord);
}
