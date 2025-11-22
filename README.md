# 📅 Citas Médicas App

Aplicación web para la gestión de citas de exámenes de diagnóstico, desarrollada con **Next.js + Supabase**.  
Permite agendar, visualizar y cancelar citas médicas con almacenamiento persistente en la nube.

---

## 🚀 Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- **Node.js v18 o superior**
- **npm** o **yarn**
- Acceso a la base de datos Supabase configurada con las tablas `usuarios` y `citas`

---

## ⚙️ Instalación y configuración

1. Clonar el repositorio y acceder al proyecto:
   ```bash
   git clone https://github.com/TheMax1270/citasmedicas.git 
   cd citasmedicas
2. Instalar dependencias(en este orden):
   npm install
   
   npm install @supabase/supabase-js

   npm install twilio
3. Verificar que el archivo env.local tenga estas claves(copiar y reemplazar el contenido del archivo):
   
   # SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://jtdmckpffriblcnfhkhi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZG1ja3BmZnJpYmxjbmZoa2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODEwMzEsImV4cCI6MjA3NzI1NzAzMX0.aW37GPKj44YPWo476jBFgADdBxAqY_4luMYsBVdWWGE

# TWILIO
TWILIO_ACCOUNT_SID=AC8f8575d01786c43af618e670421c0cbd
TWILIO_AUTH_TOKEN=01c3d4d48f4c683b9dbb8fa75ec16a67
TWILIO_PHONE_NUMBER=+16282882009

4.Ejecutar el servidor de desarrollo:
   npm run dev
   
5. Abrir en el navegador:
   http://localhost:3000


