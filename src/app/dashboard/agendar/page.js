'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AgendarCitaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [formData, setFormData] = useState({
    fecha: null,
    hora: '',
    especialidad: '',
    doctor: '',
    ubicacion: '',
  });

  const [appointmentData, setAppointmentData] = useState(null);
  const [availableFields, setAvailableFields] = useState({
    doctores: [],
    ubicaciones: ['Consultorio 101', 'Consultorio 102', 'Consultorio 201', 'Consultorio 202'],
    horas: ['06:00', '08:00', '10:00', '14:00', '16:00'],
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/appointment-data');
        const data = await res.json();
        setAppointmentData(data);

        if (isEditMode && editId) {
          const resCita = await fetch(`/api/citas?id=${editId}`);
          const citaData = await resCita.json();
          const cita = Array.isArray(citaData) ? citaData[0] : citaData;

          if (cita) {
            setFormData({
              fecha: new Date(cita.fecha),
              hora: cita.hora,
              especialidad: cita.especialidad,
              doctor: cita.doctor,
              ubicacion: cita.ubicacion,
            });
            setAvailableFields((prev) => ({
              ...prev,
              doctores: data[cita.especialidad] || [],
            }));
          }
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    };

    fetchData();
  }, [isEditMode, editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'especialidad') {
      setAvailableFields((prev) => ({
        ...prev,
        doctores: appointmentData[value] || [],
      }));
    }
  };

  const handleDateChange = (date) => setFormData((prev) => ({ ...prev, fecha: date }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || !usuario.id) {
      alert('Inicia sesión nuevamente.');
      router.push('/');
      return;
    }

    // 👉 ESTA ES LA PARTE CRÍTICA QUE TE FALTABA 👇
    const citaPayload = {
      usuario_id: usuario.id,
      especialidad: formData.especialidad,
      doctor: formData.doctor,
      fecha: formData.fecha.toISOString().split('T')[0],
      hora: formData.hora,
      ubicacion: formData.ubicacion,
      estado: 'Programada',

      telefono: usuario.telefono,   // <--- AGREGADO
      correo: usuario.correo,       // <--- AGREGADO
    };

    const method = isEditMode ? 'PATCH' : 'POST';
    const url = isEditMode ? `/api/citas?id=${editId}` : '/api/citas';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citaPayload),
      });

      if (!res.ok) throw new Error('Error al guardar la cita.');

      alert(isEditMode ? 'Cita actualizada correctamente.' : 'Cita agendada con éxito.');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Error al guardar la cita.');
    }
  };

  const isFormValid =
    formData.fecha && formData.hora && formData.especialidad && formData.doctor && formData.ubicacion;

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 bg-opacity-75">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-base font-semibold">
          {isEditMode ? 'Editar Cita' : 'Agendar Nueva Cita'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-semibold">Especialidad</label>
            <select
              name="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
              className="w-full p-2 mt-1 bg-gray-100 rounded-xl"
              required
            >
              <option value="">Seleccione la especialidad</option>
              {appointmentData &&
                Object.keys(appointmentData).map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Doctor</label>
            <select
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              disabled={!formData.especialidad}
              className="w-full p-2 mt-1 bg-gray-100 rounded-xl disabled:bg-gray-200"
              required
            >
              <option value="">Seleccione el doctor</option>
              {availableFields.doctores.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Fecha</label>
              <DatePicker
                selected={formData.fecha}
                onChange={handleDateChange}
                filterDate={isWeekday}
                minDate={tomorrow}
                dateFormat="dd-MM-yyyy"
                placeholderText="dd-mm-yy"
                className="w-full mt-1 p-[7px] bg-gray-100 rounded-xl border-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Hora</label>
              <select
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className="w-full p-2 mt-1 bg-gray-100 rounded-xl"
                required
              >
                <option value="">--:-- --</option>
                {availableFields.horas.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Ubicación</label>
            <select
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              disabled={!formData.doctor}
              className="w-full p-2 mt-1 bg-gray-100 rounded-xl disabled:bg-gray-200"
              required
            >
              <option value="">Seleccione la ubicación</option>
              {availableFields.ubicaciones.map((ubi) => (
                <option key={ubi} value={ubi}>
                  {ubi}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#808080] hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isEditMode ? 'Guardar Cambios' : 'Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
