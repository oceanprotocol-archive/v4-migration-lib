import { DDO } from './ddoV3/DDO'
import axios, { AxiosResponse } from 'axios'
require('dotenv').config()

export async function getDDO(did: string): Promise<DDO> {
  try {
    const metadataCacheUri =
      process.env.METADATACACHE_URI || 'https://aquarius.oceanprotocol.com'
    console.log(metadataCacheUri)
    const response: AxiosResponse<DDO> = await axios.get(
      `${metadataCacheUri}/api/v1/aquarius/assets/ddo/${did}`
    )
    if (!response || response.status !== 200 || !response.data) return

    const data = { ...response.data }
    return new DDO(data)
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log(error.message)
    } else {
      console.error(error.message)
    }
  }
}
