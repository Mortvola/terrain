#version 300 es

in highp vec3 TexCoords;

out highp vec4 FragColor;

uniform samplerCube skybox;

void main()
{    
    FragColor = texture(skybox, TexCoords);
    // FragColor = mix(color, vec4(TexCoords.x, TexCoords.y, 0.0, 1.0), 0.5);
}
