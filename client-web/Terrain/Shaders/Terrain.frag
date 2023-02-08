#version 300 es
in highp float fLighting;
in highp vec2 vTexCoord;
in highp vec3 vPosition;

out highp vec4 FragColor;

uniform sampler2D terrainTexture;
uniform highp vec4 uFogColor;
uniform highp float uFogNormalizationFactor;
// uniform highp float uFogNear;
// uniform highp float uFogFar;

void main() {
  highp vec4 color = mix(
    vec4(0.7, 0.7, 0.7, 1.0), // Use a light gray color as the base.
    vec4(0.3, 0.3, 0.3, 1.0), // Use a low ambient light level.
    fLighting);

  #define LOG2 1.442695

  highp float fogDistance = length(vPosition);
  highp float fogAmount = (exp2(fogDistance * LOG2 / 4096.0) - 1.0) * uFogNormalizationFactor;
  fogAmount = clamp(fogAmount, 0.0, 1.0);

  FragColor = mix(color, uFogColor, fogAmount);
}
