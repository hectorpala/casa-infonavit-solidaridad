# 🔄 Sistema de Rotación de Imágenes para Hector

## 📋 Workflow Completo

### 1. 📤 **Cuando subas nuevas imágenes:**

La página automáticamente te mostrará el **🔧 PANEL HECTOR** en la esquina superior derecha.

### 2. 🎛️ **Ajustar rotaciones:**

1. **Haz clic en "Activar Rotación"** en el panel
2. **Ve la lista de todas las imágenes** con controles:
   - **⟲** Rotar izquierda (90°)
   - **⟳** Rotar derecha (90°) 
   - **🔄** Voltear 180°
   - **↺** Restablecer
3. **Ajusta cada imagen** hasta que esté bien orientada
4. **El ángulo actual** se muestra en tiempo real

### 3. ✅ **Finalizar cambios:**

1. **Haz clic en "✅ Finalizar y Aplicar Cambios"**
2. **Confirma** que estás seguro
3. **Aparece un mensaje** con instrucciones

### 4. 🤖 **Notificar a Claude:**

Simplemente dile a Claude:

```
"Las imágenes están bien, aplica los cambios sin el panel"
```

### 5. 🚀 **Claude aplicará:**

- Las rotaciones quedarán **permanentes** en las imágenes
- **Removerá el panel** de desarrollo
- **Subirá la versión final** sin controles de rotación
- **Página limpia** para visitantes

## 🔧 **Controles del Panel:**

### Botones principales:
- **Activar Rotación** → Muestra controles de todas las imágenes
- **✅ Finalizar y Aplicar Cambios** → Marca las rotaciones como listas
- **📋 Exportar Rotaciones** → Copia los datos al portapapeles
- **Salir Modo Dev** → Oculta el panel (se reactiva automáticamente)

### Por cada imagen:
- **⟲ Izquierda** → Rota 90° hacia la izquierda
- **⟳ Derecha** → Rota 90° hacia la derecha
- **🔄 180°** → Da vuelta completa
- **↺ Reset** → Vuelve a 0°

## 📝 **Notas Importantes:**

1. **El panel SOLO aparece para ti** (modo desarrollo)
2. **Los visitantes NO ven el panel** 
3. **Las rotaciones se guardan automáticamente** mientras trabajas
4. **Puedes cerrar y abrir el navegador** sin perder el progreso
5. **Una vez finalizadas**, las rotaciones son permanentes

## 🔄 **Para futuras imágenes:**

Este sistema estará **siempre disponible** cuando agregues nuevas imágenes. Solo repite el proceso:

**Subir → Ajustar → Finalizar → Notificar a Claude**

¡Así siempre tendrás las imágenes perfectamente orientadas sin tener que lidiar con EXIF o herramientas externas!