import { DDO, DID, Logger } from '@oceanprotocol/lib'
import axios, { AxiosResponse } from 'axios'
require('dotenv').config()

export async function getDDO(did: string | DID): Promise<DDO> {
  try {
    const metadataCacheUri = process.env.METADATACACHE_URI
    console.log(metadataCacheUri)
    const response: AxiosResponse<DDO> = await axios.get(
      `${metadataCacheUri}/api/v1/aquarius/assets/ddo/${did}`
    )
    if (!response || response.status !== 200 || !response.data) return

    const data = { ...response.data }
    return new DDO(data)
  } catch (error) {
    if (axios.isCancel(error)) {
      Logger.log(error.message)
    } else {
      Logger.error(error.message)
    }
  }
}
