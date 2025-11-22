"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Calendar,
  UserCheck,
  Clock,
  Plus,
  Trash2,
  MapPin,
  User,
  LogOut,
  SquarePen,
  AlertTriangle,
} from "lucide-react";

/* -------------------------- MODAL DE CONFIRMACIÓN ------------------------- */
const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-xl text-center w-full max-w-sm">
      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
      <p className="my-4 text-gray-700">{message}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="py-2 px-6 border rounded-lg hover:bg-gray-100"
        >
          No
        </button>
        <button
          onClick={onConfirm}
          className="py-2 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Sí, cancelar
        </button>
      </div>
    </div>
  </div>
);

/* ------------------------------- STAT CARDS ------------------------------- */
const StatCard = ({ title, value, icon: Icon, color = "blue" }) => {
  const colors = {
    blue: "text-blue-500",
    green: "text-green-500",
    gray: "text-gray-400",
  };
  return (
    <div className="bg-white p-4 rounded-lg border">
      <p className="text-xl text-gray-600 mb-10">{title}</p>
      <div className="flex items-center gap-1">
        <span className="text-2xl font-medium">{value}</span>
        <Icon className={colors[color] || "text-gray-500"} size={28} />
      </div>
    </div>
  );
};

/* ------------------------------ TARJETA CITA ------------------------------ */
const CitaCard = ({ cita, onEdit, onDelete }) => {
  const today = new Date();
  const f = new Date(cita.fecha);
  const diffDays = Math.ceil(
    (f.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const canEdit = cita.estado === "Programada" && diffDays > 7;

  const statusColors = {
    Programada: "bg-blue-100 text-blue-800",
    Asistida: "bg-green-100 text-green-800",
    Cancelada: "bg-red-100 text-red-800",
  };

  return (
    <div className="bg-white p-5 rounded-lg border">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-md font-semibold text-gray-800">
            {cita.especialidad}
          </h3>
          <span
            className={`${
              statusColors[cita.estado] || "bg-gray-100 text-gray-800"
            } text-xs font-semibold mt-1 px-2.5 py-0.5 rounded-full inline-block`}
          >
            {cita.estado}
          </span>
        </div>

        {cita.estado === "Programada" && (
          <div className="flex gap-6">
            <button
              onClick={() =>
                canEdit
                  ? onEdit(cita)
                  : alert(
                      "Solo se puede editar con más de 7 días de anticipación."
                    )
              }
              className={`border rounded-md p-1 ${
                canEdit
                  ? "text-black hover:text-gray-500"
                  : "text-gray-300 cursor-not-allowed"
              }`}
            >
              <SquarePen size={18} />
            </button>

            <button
              onClick={onDelete}
              className="text-black hover:text-red-500 border rounded-md p-1"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-gray-600 space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <Calendar size={16} /> {cita.fecha}
        </p>
        <p className="flex items-center gap-2">
          <Clock size={16} /> {cita.hora}
        </p>
        <p className="flex items-center gap-2">
          <User size={16} /> {cita.doctor}
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={16} /> {cita.ubicacion}
        </p>
      </div>
    </div>
  );
};

/* ---------------------------- PÁGINA PRINCIPAL ---------------------------- */

export default function DashboardPage() {
  const [usuario, setUsuario] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tiempoSesion, setTiempoSesion] = useState("00:00");
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);
  const [activeTab, setActiveTab] = useState("proximas");
  const [recordatorios, setRecordatorios] = useState({});

  const router = useRouter();
  const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

  /* --------------------------- CERRAR SESIÓN AUTO -------------------------- */
  const handleCerrarSesion = useCallback(() => {
    localStorage.clear();
    router.push("/");
    alert("Tu sesión ha expirado por inactividad.");
  }, [router]);

  /* ----------------------------- CARGA INICIAL ----------------------------- */
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("usuario"));
    if (!u?.id) {
      router.push("/");
      return;
    }
    setUsuario(u);

    const loadCitas = async () => {
      try {
        const res = await fetch(`/api/citas?usuario_id=${u.id}`, {
          cache: "no-store",
        });
        const rows = await res.json();
        setCitas(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("Error al cargar citas:", e);
        setCitas([]);
      } finally {
        setLoading(false);
      }
    };

    loadCitas();

    const inicioSesion = parseInt(localStorage.getItem("inicioSesion"), 10);
    if (!inicioSesion) {
      router.push("/");
      return;
    }

    const intervalId = setInterval(() => {
      const t = Date.now() - inicioSesion;
      if (t > SESSION_TIMEOUT_MS) {
        clearInterval(intervalId);
        handleCerrarSesion();
      } else {
        const s = Math.floor(t / 1000);
        const m = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        setTiempoSesion(`${m}:${ss}`);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [router, handleCerrarSesion, SESSION_TIMEOUT_MS]);

  /* ------------------- SINCRONIZACIÓN DE RECORDATORIOS -------------------- */
  useEffect(() => {
    if (!citas.length) return;

    const almacenados = JSON.parse(
      localStorage.getItem("recordatorios_citas") || "{}"
    );
    const actualizado = { ...almacenados };

    citas.forEach((cita) => {
      if (!actualizado[cita.id]) {
        actualizado[cita.id] = {
          email: true,
          sms: false,
          ultimoEnvioEmail: null,
          ultimoEnvioSms: null,
        };
      }
    });

    setRecordatorios(actualizado);
    localStorage.setItem("recordatorios_citas", JSON.stringify(actualizado));
  }, [citas]);

  const guardarRecordatorios = (nuevos) => {
    setRecordatorios(nuevos);
    localStorage.setItem("recordatorios_citas", JSON.stringify(nuevos));
  };

  const actualizarCanal = (citaId, canal) => {
    const copia = { ...recordatorios };
    copia[citaId] = {
      ...copia[citaId],
      [canal]: !copia[citaId]?.[canal],
    };
    guardarRecordatorios(copia);
  };

  /* ---------------------------- ENVÍO DE CORREO REAL ---------------------------- */
  const enviarCorreoReal = async (cita) => {
    if (!usuario?.correo) {
      console.error("❌ No hay correo en usuario:", usuario);
      alert("No se encontró correo del usuario en sesión.");
      return;
    }

    await fetch("/api/notificar/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        para: usuario.correo,
        asunto: "Recordatorio de cita médica",
        mensaje: `Hola ${usuario.nombre}, recuerda tu cita de ${cita.especialidad} el ${cita.fecha} a las ${cita.hora}.`,
      }),
    });

    alert("📧 Correo enviado correctamente.");
  };

  /* ------------------------------ ENVÍO DE SMS REAL ------------------------------ */
  const enviarSMSReal = async (cita) => {
    if (!usuario?.telefono) {
      console.error("❌ No hay teléfono en usuario:", usuario);
      alert("No se encontró teléfono del usuario en sesión.");
      return;
    }

    const res = await fetch("/api/notificar/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telefono: usuario.telefono,
        mensaje: `Recordatorio: cita de ${cita.especialidad} el ${cita.fecha} a las ${cita.hora}.`,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("❌ Error al enviar SMS:", data);
      alert("No se pudo enviar el SMS.");
      return;
    }

    alert("📱 SMS enviado correctamente.");
  };

  /* ---------------------- CÁLCULO DE TIEMPO RESTANTE ---------------------- */
  const obtenerFechaHora = (cita) => {
    const [hora, minuto] = (cita.hora || "00:00").split(":");
    const fecha = new Date(cita.fecha);
    fecha.setHours(Number(hora), Number(minuto), 0, 0);
    return fecha;
  };

  const resumenRecordatorio = (cita) => {
    const fechaCita = obtenerFechaHora(cita);
    const ahora = new Date();
    const diffMs = fechaCita.getTime() - ahora.getTime();

    if (diffMs <= 0) return { texto: "Fecha pasada", estilo: "text-red-600" };

    const horas = Math.round(diffMs / (1000 * 60 * 60));
    if (horas < 1) return { texto: "Menos de 1h", estilo: "text-yellow-600" };
    if (horas <= 24) return { texto: `En ${horas}h`, estilo: "text-emerald-600" };
    return { texto: `En ${Math.ceil(horas / 24)} días`, estilo: "text-gray-600" };
  };

  /* --------------------------- CANCELACIÓN CITA --------------------------- */
  const handleConfirmCancel = async () => {
    if (!citaParaCancelar) return;
    try {
      const res = await fetch(`/api/citas?id=${citaParaCancelar.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al cancelar");
      setCitas((prev) =>
        prev.map((c) =>
          c.id === citaParaCancelar.id ? { ...c, estado: "Cancelada" } : c
        )
      );
      alert("✅ Cita cancelada correctamente.");
    } catch (e) {
      console.error(e);
      alert("❌ No se pudo cancelar la cita.");
    } finally {
      setCitaParaCancelar(null);
    }
  };

  const handleEditAppointment = (cita) => {
    router.push(`/dashboard/agendar?edit=${cita.id}`);
  };

  /* ------------------------------- RENDER ------------------------------- */

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando citas...</p>
      </div>
    );

  const todayISO = new Date().toISOString().slice(0, 10);
  const proximas = citas.filter(
    (c) => c.estado === "Programada" && c.fecha >= todayISO
  );
  const historial = citas.filter(
    (c) =>
      c.estado === "Cancelada" || (c.fecha < todayISO && c.estado !== "Cancelada")
  );
  const asistidas = historial.filter((c) => c.estado !== "Cancelada").length;
  const canceladas = historial.filter((c) => c.estado === "Cancelada").length;

  const proximasConRecordatorio = proximas.filter(
    (cita) => recordatorios[cita.id]
  );

  const dataPie = [
    { name: "Asistidas", value: asistidas, color: "#00FF8C" },
    { name: "Canceladas", value: canceladas, color: "#FF3B3B" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* ------------------------------- HEADER ------------------------------- */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto py-3 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-2 rounded-full">
              <Calendar className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-medium text-gray-800 mb-1">
                Módulo de Exámenes de Diagnóstico
              </h1>
              <p className="text-lg text-gray-500">
                Bienvenido, {usuario?.nombre}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <Clock size={16} /> Sesión: {tiempoSesion}
            </span>

            <button
              onClick={handleCerrarSesion}
              className="py-2 px-4 border gap-2 flex items-center rounded-lg text-sm hover:bg-gray-100"
            >
              <LogOut size={18} /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------- MAIN ------------------------------- */}
      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Agendar nueva cita */}
        <div className="flex justify-end mb-6">
          <Link
            href="/dashboard/agendar"
            className="flex items-center gap-2 py-1 px-4 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-gray-800"
          >
            <Plus size={20} /> Agendar cita
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Citas programadas"
            value={proximas.length}
            icon={Calendar}
          />
          <StatCard
            title="Citas completadas"
            value={asistidas}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Total de citas"
            value={citas.length}
            icon={Clock}
            color="gray"
          />
        </div>

        {/* ----------------------- PANEL DE RECORDATORIOS ----------------------- */}
        <div className="bg-white p-6 rounded-lg border mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Programador de recordatorios
              </h2>
              <p className="text-sm text-gray-500">
                Activa o desactiva los envíos automáticos por correo y SMS
              </p>
            </div>

            <div className="flex gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Próximo
                (&lt;24h)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-400" /> Próximo
                (&lt;1h)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gray-300" /> Programado
              </span>
            </div>
          </div>

          {proximasConRecordatorio.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Cita</th>
                    <th className="px-4 py-2 font-semibold">Fecha y hora</th>
                    <th className="px-4 py-2 font-semibold">Recordatorio</th>
                    <th className="px-4 py-2 font-semibold">Correo</th>
                    <th className="px-4 py-2 font-semibold">SMS</th>
                    <th className="px-4 py-2 font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {proximasConRecordatorio.map((cita) => {
                    const estado = resumenRecordatorio(cita);
                    const cfg = recordatorios[cita.id];

                    return (
                      <tr key={cita.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">
                            {cita.especialidad}
                          </div>
                          <div className="text-gray-500">
                            Dr(a). {cita.doctor}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {cita.fecha} · {cita.hora}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 ${estado.estilo}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current" />
                            {estado.texto}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <label className="inline-flex items-center gap-2 text-gray-700">
                            <input
                              type="checkbox"
                              checked={!!cfg?.email}
                              onChange={() => actualizarCanal(cita.id, "email")}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span>Correo</span>
                          </label>

                          {cfg?.ultimoEnvioEmail && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              Último envío:{" "}
                              {new Date(
                                cfg.ultimoEnvioEmail
                              ).toLocaleString()}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <label className="inline-flex items-center gap-2 text-gray-700">
                            <input
                              type="checkbox"
                              checked={!!cfg?.sms}
                              onChange={() => actualizarCanal(cita.id, "sms")}
                              className="w-4 h-4 accent-emerald-600"
                            />
                            <span>SMS</span>
                          </label>

                          {cfg?.ultimoEnvioSms && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              Último envío:{" "}
                              {new Date(cfg.ultimoEnvioSms).toLocaleString()}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 space-y-2">
                          <button
                            onClick={() => enviarCorreoReal(cita)}
                            className="text-xs px-3 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            Enviar correo
                          </button>

                          <button
                            onClick={() => enviarSMSReal(cita)}
                            className="text-xs px-3 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            Enviar SMS
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No hay citas próximas para programar recordatorios.
            </div>
          )}
        </div>

        {/* -------------------------- CONTENIDO PRINCIPAL -------------------------- */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center rounded-md border bg-[#ECECEE] w-auto md:w-[360px]">
            <button
              onClick={() => setActiveTab("proximas")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-xl ${
                activeTab === "proximas"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "bg-transparent text-gray-500"
              }`}
            >
              Próximas citas ({proximas.length})
            </button>

            <button
              onClick={() => setActiveTab("historial")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-xl ${
                activeTab === "historial"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "bg-transparent text-gray-500"
              }`}
            >
              Historial ({historial.length})
            </button>
          </div>

          <button
            onClick={() => setActiveTab("estadisticas")}
            className={`py-2 px-4 text-sm font-medium rounded-xl border ${
              activeTab === "estadisticas"
                ? "bg-white text-gray-800 shadow-sm"
                : "bg-[#ECECEE] text-gray-500 hover:bg-gray-100"
            }`}
          >
            Mis estadísticas
          </button>
        </div>

        {/* ---------------------------- LISTA Y GRÁFICAS ---------------------------- */}
        <div className="space-y-4">
          {activeTab === "proximas" &&
            (proximas.length ? (
              proximas.map((cita) => (
                <CitaCard
                  key={cita.id}
                  cita={cita}
                  onEdit={handleEditAppointment}
                  onDelete={() => setCitaParaCancelar(cita)}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border">
                <p className="text-gray-500">No tienes citas programadas.</p>
              </div>
            ))}

          {activeTab === "historial" &&
            (historial.length ? (
              historial.map((cita) => (
                <CitaCard
                  key={cita.id}
                  cita={cita}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border">
                <p className="text-gray-500">Aún no tienes historial.</p>
              </div>
            ))}

          {activeTab === "estadisticas" && (
            <div className="bg-white p-6 rounded-lg border text-center">
              <div className="w-full md:w-[400px] h-[250px] mx-auto mb-6">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dataPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive={false}
                    >
                      {dataPie.map((e, i) => (
                        <Cell
                          key={i}
                          fill={e.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Total de citas analizadas ({historial.length})
              </h3>

              <ul className="text-left space-y-2 max-w-xs mx-auto">
                {dataPie.map((d, i) => {
                  const pct = historial.length
                    ? Math.round((d.value / historial.length) * 100)
                    : 0;
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-gray-700 font-medium"
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: d.color }}
                      ></span>
                      <span>
                        ({d.value}) {d.name}{" "}
                        <span className="text-gray-500">({pct}%)</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* ---------------------------- MODAL CANCELAR ---------------------------- */}
      {citaParaCancelar && (
        <ConfirmationModal
          message="¿Seguro(a) que quiere cancelar su cita?"
          onConfirm={handleConfirmCancel}
          onCancel={() => setCitaParaCancelar(null)}
        />
      )}
    </div>
  );
}
