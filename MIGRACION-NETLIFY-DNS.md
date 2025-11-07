# 🚀 Migración a Netlify - Configuración DNS

## ✅ Estado Actual

- [x] netlify.toml configurado en root
- [x] Código pusheado a GitHub
- [ ] Sitio creado en Netlify
- [ ] Variables de entorno configuradas
- [ ] Dominio conectado
- [ ] DNS actualizado

---

## 📋 PASO A PASO

### 1. Crear Sitio en Netlify (TÚ)

**Ya abrí la página**, solo haz:

1. ✅ Authorize GitHub (si pide)
2. ✅ Seleccionar repositorio: `casa-infonavit-solidaridad`
3. ✅ Site name: `casasenventa` (o dejar random)
4. ✅ Branch: `main`
5. ✅ Build command: (vacío)
6. ✅ Publish directory: `.`
7. ✅ **Click "Deploy site"**

**Espera 1-2 minutos** al deploy.

Te dará un URL como: `https://casasenventa.netlify.app`

---

### 2. Configurar Variable de Entorno (TÚ)

En el sitio que acabas de crear:

1. Ve a: **Site settings** → **Environment variables**
2. Click: **Add a variable**
3. Agrega:
   ```
   Key: GOOGLE_MAPS_API_KEY
   Value: AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk
   Scopes: ✅ Production ✅ Deploy previews ✅ Branch deploys
   ```
4. Click: **Create variable**
5. **Trigger a new deploy** (Deploys → Trigger deploy → Deploy site)

---

### 3. Conectar Dominio Custom (TÚ)

1. En Netlify, ve a: **Domain settings**
2. Click: **Add custom domain**
3. Escribe: `casasenventa.info`
4. Click: **Verify**
5. Netlify dirá: "Awaiting external DNS"
6. Click: **Add domain**

Netlify te mostrará las **instrucciones DNS**. Cópialas.

---

### 4. Configurar DNS (TÚ - CRÍTICO)

#### Opción A: Usar Netlify DNS (Recomendado - Más Fácil)

Netlify te dará 4 nameservers:
```
dns1.p03.nsone.net
dns2.p03.nsone.net
dns3.p03.nsone.net
dns4.p03.nsone.net
```

**Ve a donde compraste el dominio** (GoDaddy, Namecheap, etc.):
1. Busca "Nameservers" o "DNS Management"
2. Cambia a "Custom nameservers"
3. Reemplaza con los 4 de Netlify
4. Save

**Ventajas:**
- ✅ Netlify maneja todo automáticamente
- ✅ SSL automático
- ✅ Más rápido

#### Opción B: Mantener tu DNS Actual

**Ve a donde compraste el dominio** → DNS Settings:

**Elimina estos records (GitHub Pages):**
- ❌ Tipo `A` que apunta a IPs de GitHub (185.199.108.153, etc.)
- ❌ Tipo `CNAME` con valor `hectorpala.github.io`

**Agrega estos records (Netlify):**

1. **Record A (apex domain):**
   ```
   Type: A
   Name: @ (o dejar vacío)
   Value: 75.2.60.5
   TTL: 3600 (o Auto)
   ```

2. **Record CNAME (www):**
   ```
   Type: CNAME
   Name: www
   Value: casasenventa.netlify.app
   TTL: 3600 (o Auto)
   ```

3. **Save changes**

---

### 5. Esperar Propagación DNS

- **Mínimo:** 5-10 minutos
- **Máximo:** 24 horas (raro)
- **Típico:** 30-60 minutos

**Verificar:**
```bash
# En terminal:
dig casasenventa.info +short
# Debería mostrar: 75.2.60.5

# O online:
https://dnschecker.org/#A/casasenventa.info
```

---

### 6. Verificar SSL en Netlify

Una vez que el DNS apunte correctamente:

1. Netlify **auto-generará** el certificado SSL
2. Ve a: **Domain settings** → **HTTPS**
3. Deberías ver: "✅ Certificate provisioned"
4. Netlify auto-redirige HTTP → HTTPS

---

### 7. Deshabilitar GitHub Pages (YO - Después)

Cuando me confirmes que casasenventa.info funciona en Netlify, yo ejecutaré:

```bash
gh api -X DELETE repos/hectorpala/casa-infonavit-solidaridad/pages
```

Esto deshabilitará GitHub Pages completamente.

---

## 🎯 RESULTADO FINAL

**Antes:**
```
casasenventa.info (GitHub Pages)
  → Solo archivos estáticos
  → /.netlify/functions/geocode → 404 ❌
  → API key expuesta en código
```

**Después:**
```
casasenventa.info (Netlify)
  → Archivos estáticos
  → /.netlify/functions/geocode → ✅ Funciona
  → API key protegida en backend
  → Deploy automático con cada push
  → SSL gratis
  → Rollbacks fáciles
```

---

## 📞 AVÍSAME CUANDO:

1. ✅ El sitio esté deployado en Netlify (me das el URL)
2. ✅ Las variables de entorno estén configuradas
3. ✅ El dominio esté conectado en Netlify
4. ✅ El DNS esté actualizado
5. ✅ casasenventa.info funcione en Netlify

Entonces yo deshabilitaré GitHub Pages.

---

## ❓ SI TIENES PROBLEMAS:

**Problema:** No puedo encontrar DNS settings
**Solución:** Dime tu proveedor de dominio (GoDaddy, Namecheap, etc.)

**Problema:** El DNS no propaga
**Solución:** Espera 1 hora. Verifica con: https://dnschecker.org

**Problema:** Netlify no genera SSL
**Solución:** Espera a que el DNS apunte correctamente primero

---

## 🎉 CUANDO TERMINE:

Tendrás:
- ✅ TODO en Netlify
- ✅ API keys seguras
- ✅ Deploy automático
- ✅ Geocoding funcionando en ambos sitios
- ✅ Deep-linking funcionando
- ✅ Un solo lugar para todo
