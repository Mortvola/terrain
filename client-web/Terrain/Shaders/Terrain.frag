#version 300 es

in highp vec2 fsTexCoords;
in highp vec3 fsTangentLightVector;

out highp vec4 FragColor;

uniform sampler2D normalMap;

void main() {
  highp vec3 normal = texture(normalMap, fsTexCoords).rgb;
  normal = normalize(normal * 2.0 - 1.0);
  
  // Use a light gray color as the base.
  highp vec3 color = vec3(0.7, 0.7, 0.7);
  
  highp vec3 ambient = 0.3 * color;

  highp float diff = max(dot(normal, fsTangentLightVector), 0.0);
  highp vec3 diffuse = diff * color;

  FragColor = vec4(ambient + diffuse, 1.0);
}
