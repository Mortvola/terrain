import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Drive from '@ioc:Adonis/Core/Drive';

export default class TerrainsController {
  async getTerrainTile({ params, response }: HttpContextContract): Promise<void> {
    const folderX = Math.floor(parseInt(params.x) / 10)
    const folderY = Math.floor(parseInt(params.y) / 10)
    const filename = `${params.x}-${params.y}-${params.dimension}.dat`

    const location = `./data/terrain/${folderX}/${folderY}/${filename}`;

    response.header('content-type', 'application/json');
    response.stream(await Drive.getStream(location))
  }
}
