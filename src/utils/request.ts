/**
 * 数据请求工具 - 用于加载 mock 数据
 */

/**
 * 加载 JSON 数据
 * @param url 相对于 /public 的路径
 */
export async function fetchJSON<T = any>(url: string): Promise<T> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error)
    throw error
  }
}

/**
 * 加载 GeoJSON 数据
 */
export async function fetchGeoJSON<T = any>(url: string): Promise<T> {
  return fetchJSON<T>(url)
}

