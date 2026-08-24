// Almacén del Access Token en memoria del módulo (nunca localStorage ni
// sessionStorage): al recargar la página el token desaparece y la sesión
// se restaura mediante el Refresh Token en cookie httpOnly.
let accessToken: string | null = null

export const tokenStore = {
  get(): string | null {
    return accessToken
  },
  set(token: string): void {
    accessToken = token
  },
  clear(): void {
    accessToken = null
  },
}
