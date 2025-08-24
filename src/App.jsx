// Welcome to the Clinical Information System Frontend (v12.0)
// Feature Update: Photo Upload & Gallery + UI Enhancements
// 1. Implemented a new feature to add photos to surgical procedures.
// 2. Added an "Agregar foto" option to the `ActionsDropdown` menu.
// 3. Created a new page component, `AgregarFotoPage`, for file selection, preview, and description entry.
// 4. Updated the `MOCK_DATA` structure to include a `fotos` array for each procedure.
// 5. Added a new "Galería de Fotos" card to the `ProcedimientoDetailPage` to display uploaded images and their descriptions.
// 6. Redesigned the date picker in `ProgramacionDiaPage` to be a single, unified component with rounded ends as requested.
// 7. Added `Camera` icon from lucide-react for the new feature.

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Camera, Home, Users, Stethoscope, User, LogOut, PlusCircle, ChevronRight, Search, X, LoaderCircle, AlertCircle, CheckCircle, CalendarDays, ClipboardList, ChevronLeft, Trash2, Edit, FileText, MoreVertical, ArrowLeft, Edit3 } from 'lucide-react';

// STYLING, ASSETS & MOCK DATA (Aligned with new DB Schema)
// ====================================================================================

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to format date verbosely
const formatDateVerbose = (dateString) => {
    if (!dateString) return '';
    // Handles potential timezone issues by parsing as UTC
    const date = new Date(`${dateString}T00:00:00Z`);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });
};

const fechaCastellano = (date) => {
    return date.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
        edad--;
    }
    return edad;
}


// Helper to format doctor names from the 'usuarios' table
const formatMedicoName = (medicoUser) => {
    if (!medicoUser) return 'N/A';
    const fullName = `${medicoUser.nombre || ''} ${medicoUser.apellido || ''}`.trim();
    if (medicoUser.privilegios !== 'Medico') {
        return fullName;
    }
    // A simple heuristic for gendered titles
    const lowerCaseName = medicoUser.nombre.toLowerCase();
    const isFemale = lowerCaseName.endsWith('a') || ['isabel', 'carmen', 'ana'].includes(lowerCaseName);
    const prefix = isFemale ? 'Dra.' : 'Dr.';
    return `${prefix} ${fullName}`;
};


const MOCK_DATA = {
    // Corresponds to 'usuarios' table
    usuarios: [
        { id_usuario: 1, login: 'admin', email: 'admin@clinica.com', password: 'admin', nombre: 'Admin', apellido: 'General', telefono: '555-0101', privilegios: 'Admin', id_hospital: 1 },
        { id_usuario: 2, login: 'dra.vega', email: 'ana.vega@clinica.com', password: 'password', nombre: 'Ana', apellido: 'Vega', telefono: '555-0102', privilegios: 'Medico', id_hospital: 1 },
        { id_usuario: 3, login: 'dr.soto', email: 'carlos.soto@clinica.com', password: 'password', nombre: 'Carlos', apellido: 'Soto', telefono: '555-0103', privilegios: 'Medico', id_hospital: 1 },
        { id_usuario: 4, login: 'enf.lopez', email: 'laura.lopez@clinica.com', password: 'password', nombre: 'Laura', apellido: 'López', telefono: '555-0104', privilegios: 'Enfermeria', id_hospital: 1 },
        { id_usuario: 5, login: 'adm.rios', email: 'mario.rios@clinica.com', password: 'password', nombre: 'Mario', apellido: 'Ríos', telefono: '555-0105', privilegios: 'Administrativo', id_hospital: 1 },
        { id_usuario: 6, login: 'dr.perez', email: 'roberto.perez@clinica.com', password: 'password', nombre: 'Roberto', apellido: 'Perez', telefono: '555-0106', privilegios: 'Medico', id_hospital: 1 },
        { id_usuario: 7, login: 'dr.gomez', email: 'luis.gomez@clinica.com', password: 'password', nombre: 'Luis', apellido: 'Gómez', telefono: '555-0107', privilegios: 'Medico', id_hospital: 1 },
    ],
    // Corresponds to 'medicos' table, linking to 'usuarios'
    medicos: [
        { id_medico: 1, id_usuario: 2, cedula: '12345678', especialidad: 'Anestesióloga' },
        { id_medico: 2, id_usuario: 3, cedula: '87654321', especialidad: 'Cirujano Ortopedista' },
        { id_medico: 3, id_usuario: 6, cedula: '11223344', especialidad: 'Cirujano General' },
        { id_medico: 4, id_usuario: 7, cedula: '44332211', especialidad: 'Médico General' },
    ],
    // Corresponds to 'pacientes' table
    pacientes: [
        { id_paciente: 101, id_hospital: 1, nombre: 'Elena', apellido: 'Ramírez Gómez', fecha_nacimiento: '1985-05-20', sexo: 'F', rfc: 'RAGE850520HDF', telefono: '555-0201' },
        { id_paciente: 102, id_hospital: 1, nombre: 'Roberto', apellido: 'Jiménez López', fecha_nacimiento: '1972-11-15', sexo: 'M', rfc: 'JILR721115HDF', telefono: '555-0202' },
        { id_paciente: 103, id_hospital: 1, nombre: 'Sofía', apellido: 'Hernández Cruz', fecha_nacimiento: '1990-02-10', sexo: 'F', rfc: 'HECS900210MDF', telefono: '555-0203' },
        { id_paciente: 104, id_hospital: 1, nombre: 'Miguel Ángel', apellido: 'Flores', fecha_nacimiento: '2001-07-22', sexo: 'M', rfc: 'FLOM010722HDF', telefono: '555-0204' },
    ],
    // Corresponds to 'procedimientos' table
    procedimientos: [
        {
            id_procedimiento: 201, id_paciente: 101, id_hospital: 1, id_medico: 3, fecha_qx: getTodayDateString(), diagnostico: 'Colecistitis crónica', qx_planeada: 'Colecistectomía laparoscópica', qx_anestesiologo: 2, id_ayudante: 6, status: 'Post-op', // Custom status for frontend logic
            fotos: [
                { url: 'https://placehold.co/600x400/d1d9e6/4A5568?text=Herida+Quirúrgica\nDía+1', description: 'Herida quirúrgica en el primer día postoperatorio.' },
                { url: 'https://placehold.co/600x400/d1d9e6/4A5568?text=Herida+Quirúrgica\nDía+3', description: 'Revisión de herida al tercer día. Sin datos de infección.' }
            ],
            riesgos: 'Lesión de vía biliar, sangrado, infección de sitio quirúrgico, conversión a cirugía abierta.',
            beneficios: 'Resolución del cuadro de colecistitis, disminución del dolor, prevención de complicaciones como pancreatitis o colangitis.',
            resumen_ingreso: {
                signosVitales: { TA: '120/80', FC: '75', FR: '16', Temp: '36.5', SatO2: '98' },
                interrogatorio: 'Paciente refiere dolor en hipocondrio derecho de 2 semanas de evolución.',
                exploracionFisica: 'Abdomen blando, depresible, doloroso a la palpación en hipocondrio derecho, Murphy positivo.',
                planTratamiento: 'Se programa para colecistectomía laparoscópica bajo anestesia general balanceada.'
            },
            notaPreanestesica: {
                antecedentes: { tabaquismo: 'Negado', alcoholismo: 'Social', toxicomanias: 'Negado', ejercicio: 'Ocasional', asma: 'Negado', alergias: 'Penicilina', cardiovascular: 'Hipertensión controlada', pulmonar: 'Negado', endocrinologico: 'Negado', antecedentes_anestesicos: 'Anestesia general en 2010 sin complicaciones', antecedentes_quirurgicos: 'Apendicectomía en 2010' },
                exploracion: { peso: '65', talla: '160', TA: '125/85', FC: '80', FR: '17', Temp: '36.6', SatO2: '97', tegumentos: 'Normal', cabeza: 'Normal', traquea: 'Central', CP: 'Bien ventilados', cardio: 'Rítmico', extremidades: 'Normales' },
                viaAerea: { mallampati: 'Clase I', aldreti: '9', bellhouseDore: 'Grado I', interincisiva: '4 cm', outras: 'Ninguna' },
                laboratorio: { hb: '13.5', hct: '40', leucos: '8.5', plaquetas: '250', glucosa: '95', creatinina: '0.8', bun: '15', urea: '30', tp: '12.5', ttp: '30', inr: '1.0' },
                ekg: 'Ritmo sinusal, sin alteraciones.',
                planAnestesico: { valoraciones: 'Valoración cardiológica preoperatoria sin contraindicaciones.', plan: 'Anestesia general balanceada con intubación orotraqueal.', indicaciones: 'Ayuno de 8 horas, continuar antihipertensivo.' }
            },
            notaPostanestesica: {
                tecnica_anestesica: 'Anestesia general balanceada con Sevoflurano, Fentanilo y Rocuronio.',
                liquidos: '1000cc Solución Hartmann',
                inicio_anestesia: '08:00',
                termino_anestesia: '09:30',
                inicio_cirugia: '08:15',
                termino_cirugia: '09:15',
                signosVitalesIngresoUCPA: { TA: '110/70', FC: '70', FR: '15', Temp: '36.8', SatO2: '99' },
                signosVitalesAltaUCPA: { TA: '115/75', FC: '68', FR: '16', Temp: '36.7', SatO2: '98' },
                signosVitalesAltaAnestesio: { TA: '120/80', FC: '65', FR: '16', Temp: '36.6', SatO2: '98' },
                indicaciones_altaAnestesio: 'Vigilar sangrado, control del dolor con analgésicos IV. Puede iniciar dieta líquida en 2 horas si no hay náuseas.'
            },
            diagnostico_postqx: 'Colecistitis crónica litiásica',
            cirugia_realizada: 'Colecistectomía laparoscópica',
            tecnica: 'Bajo anestesia general balanceada, se realiza asepsia y antisepsia, se colocan trocares y se procede a la disección del triángulo de Calot, identificando arteria y conducto cístico, los cuales se ligan y seccionan. Se extrae vesícula biliar sin incidentes.',
            hallazgos: 'Vesícula biliar de paredes engrosadas, con múltiples litos en su interior.',
            sangrado: '50cc',
            incidentes: 'Ninguno',
            complicaciones: 'Ninguna',
            cuenta_material: 'Completa',
            pronostico: 'Bueno para la vida y la función.',
            indicaciones_postop: {
                soluciones_dieta: 'Dieta líquida por 24h, luego progresar a blanda según tolerancia.',
                medicamentos: 'Paracetamol 1g IV cada 8 horas.\nKetorolaco 30mg IV cada 12 horas.',
                examenes: 'No se requieren por el momento.',
                actividades_enfermeria: 'Vigilar signos vitales cada 4 horas. Curación de herida quirúrgica cada 24h. Fomentar deambulación asistida.'
            },
            nota_de_alta: {
                fecha_egreso: getTodayDateString(),
                dx_egreso: 'Postoperada de colecistectomía laparoscópica, evolución favorable.',
                motivo_egreso: 'mejoria',
                resumen_egreso: 'Paciente evoluciona satisfactoriamente, sin dolor, tolera la vía oral. Heridas quirúrgicas limpias.',
                indicaciones_egreso: 'Cita en 7 días para retiro de puntos. Continuar con analgésicos vía oral. Dieta blanda.'
            }
        },
        {
            id_procedimiento: 202, id_paciente: 102, id_hospital: 1, id_medico: 3, fecha_qx: getTodayDateString(), diagnostico: 'Fractura de tobillo', qx_planeada: 'Reducción abierta y fijación interna', qx_anestesiologo: 2, id_ayudante: 6, status: 'Programado', fotos: [],
        },
        {
            id_procedimiento: 204, id_paciente: 103, id_hospital: 1, id_medico: 6, fecha_qx: getTodayDateString(), diagnostico: 'Extracción de lipoma', qx_planeada: 'Resección de lipoma', qx_anestesiologo: 2, id_ayudante: 7, status: 'Alta', fotos: [],
            nota_de_alta: {
                fecha_egreso: getTodayDateString(),
                dx_egreso: 'Postoperada de resección de lipoma.',
                motivo_egreso: 'mejoria',
                resumen_egreso: 'Paciente egresa por mejoría, con herida quirúrgica limpia y sin dolor. Cita en 7 días para retiro de puntos.',
                indicaciones_egreso: 'Mantener herida limpia y seca.'
            }
        },
        {
            id_procedimiento: 203, id_paciente: 104, id_hospital: 1, id_medico: 6, fecha_qx: '2025-08-22', diagnostico: 'Hernia inguinal', qx_planeada: 'Hernioplastia', qx_anestesiologo: 2, id_ayudante: 3, status: 'Programado', fotos: [],
        },
    ]
};


// UI COMPONENTS (Neumorphic Style)
// ====================================================================================

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-100 rounded-xl shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold focus:outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed';
  const neumorphicBase = 'shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]';
  
  const variants = {
    primary: `bg-blue-600 text-white hover:bg-blue-700 ${neumorphicBase}`,
    secondary: `bg-slate-100 text-gray-700 hover:bg-slate-200 ${neumorphicBase}`,
    danger: `bg-red-600 text-white hover:bg-red-700 ${neumorphicBase}`,
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ id, label, type = 'text', value, onChange, placeholder, required = false, name, disabled = false, ...props }) => (
  <div>
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-2 ml-1">{label}</label>}
    <input
      type={type}
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="block w-full px-4 py-2.5 border-none bg-slate-100 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-slate-200 shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_#ffffff]"
      {...props}
    />
  </div>
);

const Textarea = ({ id, label, value, onChange, placeholder, rows = 4, name, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-2 ml-1">{label}</label>
        <textarea
            id={id}
            name={name || id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="block w-full px-4 py-2.5 border-none bg-slate-100 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_#ffffff]"
            {...props}
        />
    </div>
);


const Select = ({ id, label, value, onChange, children, required = false, name }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-2 ml-1">{label}</label>
        <select
            id={id}
            name={name || id}
            value={value}
            onChange={onChange}
            required={required}
            className="block w-full px-4 py-2.5 border-none bg-slate-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_#ffffff]"
        >
            {children}
        </select>
    </div>
);

const SkeletonLoader = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-300 rounded-md ${className}`}></div>
);

const Modal = ({ show, onClose, title, children, size = '2xl' }) => {
    if (!show) return null;
    
    const sizeClasses = {
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 bg-slate-200/40 z-40 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className={`bg-slate-100 rounded-xl shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] w-full m-4 ${sizeClasses[size]}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-200/80">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, children }) => {
    if (!show) return null;

    return (
        <Modal show={show} onClose={onClose} title={title} size="md">
            <div className="p-6">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 shadow-[inset_3px_3px_5px_#d4a4a4,inset_-3px_-3px_5px_#ffffff]">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <div className="mt-2">
                            <p className="text-sm text-gray-600">{children}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-slate-100/80 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl">
                <Button variant="danger" onClick={onConfirm}>Eliminar</Button>
                <Button variant="secondary" onClick={onClose} className="mr-3">Cancelar</Button>
            </div>
        </Modal>
    );
};


// AUTHENTICATION CONTEXT
// ====================================================================================

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('sic-user-v7');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('sic-user-v7');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  const login = (login, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_DATA.usuarios.find(u => u.login === login && u.password === password);
        if (foundUser) {
          const { password, ...userToStore } = foundUser;
          setUser(userToStore);
          localStorage.setItem('sic-user-v7', JSON.stringify(userToStore));
          resolve(userToStore);
        } else {
          reject('Credenciales inválidas.');
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sic-user-v7');
  };

  const value = { user, login, logout, isAuthenticated: !!user };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-100">
        <LoaderCircle className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// LAYOUT COMPONENTS
// ====================================================================================

const Sidebar = ({ currentView, setView }) => {
  const { user, logout } = useAuth();

  const navItems = {
    Admin: [
      { id: 'programacion', label: 'Programación Qx', icon: CalendarDays },
      { id: 'pacientes', label: 'Pacientes', icon: Users },
      { id: 'usuarios', label: 'Usuarios', icon: ClipboardList },
    ],
    Medico: [
      { id: 'programacion', label: 'Programación Qx', icon: CalendarDays },
      { id: 'pacientes', label: 'Mis Pacientes', icon: Users },
    ],
    Enfermeria: [
        { id: 'programacion', label: 'Programación Qx', icon: CalendarDays },
    ],
    Administrativo: [
        { id: 'programacion', label: 'Programación Qx', icon: CalendarDays },
        { id: 'pacientes', label: 'Pacientes', icon: Users },
    ]
  };

  const userNav = navItems[user?.privilegios] || [];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-100 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-slate-200/80">
        <Stethoscope className="h-8 w-8 text-blue-600" />
        <h1 className="ml-2 text-xl font-bold text-gray-800 tracking-tight">Clínica SIC</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {userNav.map(item => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => { e.preventDefault(); setView(item.id, null); }}
            className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${currentView === item.id ? 'bg-slate-100 text-blue-600 shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200/80">
        <div className="flex items-center p-3 rounded-lg bg-slate-100 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shadow-[inset_3px_3px_5px_#d1d9e6,inset_-3px_-3px_5px_#ffffff]">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-800">{user.nombre} {user.apellido}</p>
            <p className="text-xs text-gray-500">{user.privilegios}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-4 flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

// PAGE/VIEW COMPONENTS
// ====================================================================================

const LoginPage = () => {
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginValue, password);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Stethoscope className="h-12 w-auto text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sistema de Información Clínica
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-8 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input id="login" label="Usuario" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} required />
            <Input id="password" label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" className="w-full">
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

const AgendarCirugiaModal = ({ show, onClose, onSave, initialData }) => {
    const isEditing = !!initialData?.id_procedimiento;
    const [formData, setFormData] = useState({
        id_paciente: '',
        id_medico: '',
        qx_anestesiologo: '',
        id_ayudante: '',
        fecha_qx: getTodayDateString(),
        diagnostico: '',
        qx_planeada: '',
    });

    useEffect(() => {
        if (isEditing) {
            setFormData({
                id_paciente: initialData.id_paciente || '',
                id_medico: initialData.id_medico || '',
                qx_anestesiologo: initialData.qx_anestesiologo || '',
                id_ayudante: initialData.id_ayudante || '',
                fecha_qx: initialData.fecha_qx || getTodayDateString(),
                diagnostico: initialData.diagnostico || '',
                qx_planeada: initialData.qx_planeada || '',
            });
        } else {
             setFormData(prev => ({ ...prev, fecha_qx: initialData.fecha_qx }));
        }
    }, [initialData, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const procedurePayload = {
            ...initialData, // Keeps original ID and other fields if editing
            ...formData,
            id_paciente: parseInt(formData.id_paciente),
            id_medico: parseInt(formData.id_medico),
            qx_anestesiologo: parseInt(formData.qx_anestesiologo),
            id_ayudante: parseInt(formData.id_ayudante),
            status: isEditing ? initialData.status : 'Programado', // Keep frontend status
            id_procedimiento: isEditing ? initialData.id_procedimiento : Date.now(),
            id_hospital: 1 // Assuming a single hospital for now
        };
        onSave(procedurePayload);
        onClose();
    };

    // Filter logic for medical staff
    const medicosUsuarios = MOCK_DATA.usuarios.filter(u => u.privilegios === 'Medico');
    const medicosConEspecialidad = medicosUsuarios.map(user => {
        const medicoInfo = MOCK_DATA.medicos.find(m => m.id_usuario === user.id_usuario);
        return { ...user, ...medicoInfo };
    });

    const cirujanos = medicosConEspecialidad.filter(m => m.especialidad !== 'Anestesióloga');
    const anestesiologos = medicosConEspecialidad.filter(m => m.especialidad === 'Anestesióloga');
    const ayudantes = medicosUsuarios; // Any doctor can be an assistant

    return (
        <Modal show={show} onClose={onClose} title={isEditing ? "Editar Procedimiento" : "Agendar Nuevo Procedimiento"}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <Select name="id_paciente" label="Paciente" value={formData.id_paciente} onChange={handleChange} required>
                        <option value="">Seleccione un paciente...</option>
                        {MOCK_DATA.pacientes.map(p => (
                            <option key={p.id_paciente} value={p.id_paciente}>{p.nombre} {p.apellido}</option>
                        ))}
                    </Select>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="fecha_qx" label="Fecha" type="date" value={formData.fecha_qx} onChange={handleChange} required />
                        <Input name="diagnostico" label="Diagnóstico Principal" value={formData.diagnostico} onChange={handleChange} required />
                    </div>
                    <Input name="qx_planeada" label="Cirugía Planeada" value={formData.qx_planeada} onChange={handleChange} required />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <Select name="id_medico" label="Cirujano" value={formData.id_medico} onChange={handleChange} required>
                            <option value="">Seleccione...</option>
                            {cirujanos.map(m => <option key={m.id_usuario} value={m.id_usuario}>{formatMedicoName(m)}</option>)}
                        </Select>
                        <Select name="qx_anestesiologo" label="Anestesiólogo" value={formData.qx_anestesiologo} onChange={handleChange} required>
                            <option value="">Seleccione...</option>
                            {anestesiologos.map(m => <option key={m.id_usuario} value={m.id_usuario}>{formatMedicoName(m)}</option>)}
                        </Select>
                        <Select name="id_ayudante" label="Ayudante" value={formData.id_ayudante} onChange={handleChange} required>
                            <option value="">Seleccione...</option>
                            {ayudantes.map(m => <option key={m.id_usuario} value={m.id_usuario}>{formatMedicoName(m)}</option>)}
                        </Select>
                    </div>
                </div>
                <div className="p-4 bg-slate-100/80 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">{isEditing ? "Actualizar" : "Guardar"}</Button>
                </div>
            </form>
        </Modal>
    );
};

const DocumentSelectionModal = ({ show, onClose, onSelectDocument, procedure }) => {
    const documents = [
        { name: "Nota de Ingreso", action: () => onSelectDocument('notaIngreso') },
        { name: "Consentimiento Quirúrgico", action: () => onSelectDocument('consentimientoQuirurgico') },
        { name: "Consentimiento Anestésico", action: () => onSelectDocument('consentimientoAnestesico') },
        { name: "Nota Preanestésica", action: () => onSelectDocument('notaPreanestesica') },
        { name: "Nota Postanestésica", action: () => onSelectDocument('notaPostanestesica') },
        { name: "Nota Postoperatoria", action: () => onSelectDocument('notaPostoperatoria') },
        { name: "Indicaciones Postoperatorias", action: () => onSelectDocument('indicacionesPostoperatorias') },
        { name: "Nota de Alta", action: () => onSelectDocument('notaDeAlta') },
    ];
    
    if (!procedure) return null;

    return (
        <Modal show={show} onClose={onClose} title="Generar Documentos">
            <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Seleccione el documento que desea editar o generar para el procedimiento:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documents.map(doc => (
                        <button key={doc.name} onClick={doc.action} className="w-full text-left p-3 bg-slate-200/50 hover:bg-slate-200 rounded-lg flex items-center transition-colors duration-200">
                            <FileText className="h-5 w-5 mr-3 text-gray-500" />
                            <span className="text-sm font-medium text-gray-800">{doc.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};


const ProgramacionDiaPage = ({ onSelectProcedure }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [procedimientos, setProcedimientos] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState(null);
    
    const fetchProcedimientos = (date) => {
        setLoading(true);
        setTimeout(() => { // Simulate API call
            const filtered = MOCK_DATA.procedimientos.filter(p => p.fecha_qx === date);
            setProcedimientos(filtered);
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchProcedimientos(selectedDate);
    }, [selectedDate]);

    const handleDateChange = (days) => {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        currentDate.setUTCDate(currentDate.getUTCDate() + days);
        const newYear = currentDate.getUTCFullYear();
        const newMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const newDay = String(currentDate.getUTCDate()).padStart(2, '0');
        setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
    };

    const handleSaveProcedure = (procedureData) => {
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureData.id_procedimiento);
        if (index > -1) {
            MOCK_DATA.procedimientos[index] = procedureData;
        } else {
            MOCK_DATA.procedimientos.push(procedureData);
        }
        if (procedureData.fecha_qx === selectedDate) {
            fetchProcedimientos(selectedDate);
        }
    };

    const handleDeleteClick = (procedure) => {
        setSelectedProcedure(procedure);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === selectedProcedure.id_procedimiento);
        if (index > -1) {
            MOCK_DATA.procedimientos.splice(index, 1);
        }
        fetchProcedimientos(selectedDate);
        setIsConfirmModalOpen(false);
        setSelectedProcedure(null);
    };

    const handleEditClick = (procedure) => {
        setSelectedProcedure(procedure);
        setIsAgendaModalOpen(true);
    };

    const handleDocsClick = (procedure) => {
        setSelectedProcedure(procedure);
        setIsDocsModalOpen(true);
    };
    
    const handleAddPhotoClick = (procedure) => {
        onSelectProcedure(procedure.id_procedimiento, 'agregarFoto');
    };

    const statusColors = {
        'Programado': 'bg-blue-200 text-blue-800',
        'Post-op': 'bg-green-200 text-green-800',
        'Alta': 'bg-slate-200 text-slate-800',
    };

    const canManage = user.privilegios === 'Admin' || user.privilegios === 'Administrativo';

    return (
        <div>
            <AgendarCirugiaModal 
                show={isAgendaModalOpen} 
                onClose={() => { setIsAgendaModalOpen(false); setSelectedProcedure(null); }} 
                onSave={handleSaveProcedure}
                initialData={selectedProcedure || { fecha_qx: selectedDate }}
            />
            <ConfirmationModal
                show={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Procedimiento"
            >
                ¿Estás seguro de que deseas eliminar este procedimiento de la programación? Esta acción es irreversible.
            </ConfirmationModal>
            <DocumentSelectionModal
                show={isDocsModalOpen}
                onClose={() => setIsDocsModalOpen(false)}
                procedure={selectedProcedure}
                onSelectDocument={(docType) => {
                    setIsDocsModalOpen(false);
                    onSelectProcedure(selectedProcedure.id_procedimiento, docType);
                }}
            />
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Programación Quirúrgica</h1>
                    <p className="mt-1 text-gray-600">Procedimientos agendados para el día seleccionado.</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center bg-slate-100 rounded-full shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_#ffffff]">
                        <Button variant="secondary" onClick={() => handleDateChange(-1)} aria-label="Día anterior" className="!p-2.5 !rounded-full !shadow-none">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <input 
                            id="date-selector" 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-center text-gray-700 font-semibold focus:outline-none"
                        />
                        <Button variant="secondary" onClick={() => handleDateChange(1)} aria-label="Día siguiente" className="!p-2.5 !rounded-full !shadow-none">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                     <Button onClick={() => { setSelectedProcedure(null); setIsAgendaModalOpen(true); }}><PlusCircle className="w-5 h-5 mr-2" /> Agendar Cirugía</Button>
                </div>
            </div>
            <Card className="mt-8">
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead >
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedimiento Planeado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cirujano</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anestesiólogo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ayudante</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                {canManage && <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80">
                           {loading ? (
                                Array.from({ length: 2 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-40" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-48" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-24" /></td>
                                        {canManage && <td className="px-6 py-4"><SkeletonLoader className="h-4 w-12" /></td>}
                                    </tr>
                                ))
                            ) : procedimientos.length > 0 ? (
                                procedimientos.map(proc => {
                                    const paciente = MOCK_DATA.pacientes.find(p => p.id_paciente === proc.id_paciente);
                                    const cirujano = MOCK_DATA.usuarios.find(u => u.id_usuario === proc.id_medico);
                                    const anestesiologo = MOCK_DATA.usuarios.find(u => u.id_usuario === proc.qx_anestesiologo);
                                    const ayudante = MOCK_DATA.usuarios.find(u => u.id_usuario === proc.id_ayudante);
                                    return (
                                        <tr key={proc.id_procedimiento} className="hover:bg-slate-200/50 cursor-pointer transition-colors duration-200" onClick={() => onSelectProcedure(proc.id_procedimiento, 'procedimientoDetail')}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{paciente?.nombre} {paciente?.apellido}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{proc.qx_planeada}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatMedicoName(cirujano)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatMedicoName(anestesiologo)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatMedicoName(ayudante)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[proc.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {proc.status}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
                                                    <ActionsDropdown 
                                                        onEdit={() => handleEditClick(proc)}
                                                        onDelete={() => handleDeleteClick(proc)}
                                                        onDocs={() => handleDocsClick(proc)}
                                                        onAddPhoto={() => handleAddPhotoClick(proc)}
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={canManage ? 7 : 6} className="text-center py-10 text-gray-500">
                                        No hay procedimientos programados para esta fecha.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const ActionsDropdown = ({ onEdit, onDelete, onDocs, onAddPhoto }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref]);

    return (
        <div className="relative inline-block text-left" ref={ref}>
            <div>
                 <button onClick={() => setIsOpen(!isOpen)} type="button" className="inline-flex justify-center w-full rounded-md p-2 bg-slate-100 text-sm font-medium text-gray-700 hover:bg-slate-200 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] active:shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] transition-all duration-200">
                    <MoreVertical className="h-5 w-5" />
                </button>
            </div>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] bg-slate-100 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <a href="#" onClick={(e) => { e.preventDefault(); onEdit(); setIsOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-200/60 rounded-t-lg" role="menuitem">
                            <Edit className="mr-3 h-5 w-5 text-gray-400" />
                            <span>Editar datos</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onAddPhoto(); setIsOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-200/60" role="menuitem">
                            <Camera className="mr-3 h-5 w-5 text-gray-400" />
                            <span>Agregar foto</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onDocs(); setIsOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-200/60" role="menuitem">
                            <FileText className="mr-3 h-5 w-5 text-gray-400" />
                            <span>Generar documentos</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onDelete(); setIsOpen(false); }} className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-b-lg" role="menuitem">
                            <Trash2 className="mr-3 h-5 w-5 text-red-400" />
                            <span>Borrar</span>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};


const PacienteModal = ({ show, onClose, onSave, patientData }) => {
    const isEditing = !!patientData;
    const initialFormState = {
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        sexo: 'M',
        rfc: '',
        telefono: '',
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (isEditing) {
            setFormData({
                nombre: patientData.nombre || '',
                apellido: patientData.apellido || '',
                fecha_nacimiento: patientData.fecha_nacimiento || '',
                sexo: patientData.sexo || 'M',
                rfc: patientData.rfc || '',
                telefono: patientData.telefono || '',
            });
        } else {
            setFormData(initialFormState);
        }
    }, [patientData, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const patientPayload = isEditing 
            ? { ...patientData, ...formData } 
            : { id_paciente: Date.now(), id_hospital: 1, ...formData };
        
        onSave(patientPayload);
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} title={isEditing ? "Editar Paciente" : "Registrar Nuevo Paciente"}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="nombre" label="Nombre(s)" value={formData.nombre} onChange={handleChange} required />
                        <Input name="apellido" label="Apellido(s)" value={formData.apellido} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="fecha_nacimiento" label="Fecha de Nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} required />
                        <Select name="sexo" label="Sexo" value={formData.sexo} onChange={handleChange} required>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                        </Select>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="telefono" label="Teléfono" type="tel" value={formData.telefono} onChange={handleChange} />
                        <Input name="rfc" label="RFC" value={formData.rfc} onChange={handleChange} />
                    </div>
                </div>
                <div className="p-4 bg-slate-100/80 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">{isEditing ? "Actualizar Paciente" : "Guardar Paciente"}</Button>
                </div>
            </form>
        </Modal>
    );
};

const PacientesPage = ({ onSelectProcedure }) => {
    const { user } = useAuth();
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const itemsPerPage = 10;

    const fetchPacientes = () => {
        setLoading(true);
        setTimeout(() => { // Simulate API call
            let fetchedPacientes = MOCK_DATA.pacientes;

            if (user.privilegios === 'Medico') {
                const involvedPatientIds = new Set(
                    MOCK_DATA.procedimientos
                        .filter(p => p.id_medico === user.id_usuario || p.qx_anestesiologo === user.id_usuario || p.id_ayudante === user.id_usuario)
                        .map(p => p.id_paciente)
                );
                fetchedPacientes = MOCK_DATA.pacientes.filter(p => involvedPatientIds.has(p.id_paciente));
            }

            setPacientes(fetchedPacientes);
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchPacientes();
    }, [user]);

    const handleSavePatient = (patientData) => {
        if (editingPatient) {
            const index = MOCK_DATA.pacientes.findIndex(p => p.id_paciente === patientData.id_paciente);
            if (index !== -1) MOCK_DATA.pacientes[index] = { ...MOCK_DATA.pacientes[index], ...patientData };
        } else {
            MOCK_DATA.pacientes.push(patientData);
        }
        fetchPacientes();
    };

    const handleOpenModal = (patient = null) => {
        setEditingPatient(patient);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPatient(null);
    };

    const filteredPacientes = pacientes.filter(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPacientes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPacientes.length / itemsPerPage);

    return (
        <div>
            <PacienteModal show={isModalOpen} onClose={handleCloseModal} onSave={handleSavePatient} patientData={editingPatient} />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Pacientes</h1>
                    <p className="mt-1 text-gray-600">Busca, crea y administra los registros de tus pacientes.</p>
                </div>
                <Button onClick={() => handleOpenModal()}><PlusCircle className="w-5 h-5 mr-2" /> Nuevo Paciente</Button>
            </div>

            <Card className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="block w-full pl-10 pr-3 py-2 border-none bg-slate-100 rounded-lg shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_#ffffff]"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Nacimiento</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-40" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-12" /></td>
                                    </tr>
                                ))
                            ) : (
                                currentItems.map(paciente => (
                                    <tr key={paciente.id_paciente} className="hover:bg-slate-200/50 cursor-pointer" onClick={() => {
                                        const proc = MOCK_DATA.procedimientos.find(p => p.id_paciente === paciente.id_paciente);
                                        if (proc) onSelectProcedure(proc.id_procedimiento);
                                    }}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paciente.nombre} {paciente.apellido}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateVerbose(paciente.fecha_nacimiento)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paciente.telefono}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(paciente);}} className="text-blue-600 hover:text-blue-900 transition-colors duration-200">Editar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="py-3 flex items-center justify-between border-t border-slate-200/80 mt-4">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</Button>
                        <Button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Siguiente</Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, filteredPacientes.length)}</span> de <span className="font-medium">{filteredPacientes.length}</span> resultados
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md -space-x-px">
                                <Button variant="secondary" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="!rounded-l-full !rounded-r-none">Anterior</Button>
                                <Button variant="secondary" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="!rounded-r-full !rounded-l-none">Siguiente</Button>
                            </nav>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const UsuarioModal = ({ show, onClose, onSave, userData }) => {
    const isEditing = !!userData;
    const initialFormState = {
        nombre: '',
        apellido: '',
        login: '',
        email: '',
        telefono: '',
        privilegios: 'Medico',
        password: '',
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (isEditing) {
            setFormData({
                nombre: userData.nombre || '',
                apellido: userData.apellido || '',
                login: userData.login || '',
                email: userData.email || '',
                telefono: userData.telefono || '',
                privilegios: userData.privilegios || 'Medico',
                password: '', // Password is not pre-filled for security
            });
        } else {
            setFormData(initialFormState);
        }
    }, [userData, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const userPayload = isEditing 
            ? { ...userData, ...formData } 
            : { id_usuario: Date.now(), id_hospital: 1, ...formData };
        
        if (!isEditing && !userPayload.password) {
            // In a real app, use a proper notification system instead of alert
            console.error("La contraseña es obligatoria para nuevos usuarios.");
            return;
        }
        if (isEditing && !userPayload.password) {
            delete userPayload.password;
        }

        onSave(userPayload);
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} title={isEditing ? "Editar Usuario" : "Registrar Nuevo Usuario"}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="nombre" label="Nombre(s)" value={formData.nombre} onChange={handleChange} required />
                        <Input name="apellido" label="Apellidos" value={formData.apellido} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="login" label="Login de Usuario" value={formData.login} onChange={handleChange} required />
                        <Input name="email" label="Email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="telefono" label="Teléfono" type="tel" value={formData.telefono} onChange={handleChange} />
                        <Select name="privilegios" label="Rol / Privilegios" value={formData.privilegios} onChange={handleChange} required>
                            <option value="Medico">Médico</option>
                            <option value="Enfermeria">Enfermería</option>
                            <option value="Administrativo">Administrativo</option>
                            <option value="Admin">Admin</option>
                        </Select>
                    </div>
                    <Input name="password" label={isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"} type="password" value={formData.password} onChange={handleChange} required={!isEditing} />
                </div>
                <div className="p-4 bg-slate-100/80 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">{isEditing ? "Actualizar Usuario" : "Guardar Usuario"}</Button>
                </div>
            </form>
        </Modal>
    );
};

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const itemsPerPage = 10;

    const fetchUsuarios = () => {
        setLoading(true);
        setTimeout(() => { // Simulate API call
            setUsuarios(MOCK_DATA.usuarios);
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleSaveUser = (userData) => {
        if (editingUser) {
            const index = MOCK_DATA.usuarios.findIndex(u => u.id_usuario === userData.id_usuario);
            if (index !== -1) MOCK_DATA.usuarios[index] = userData;
        } else {
            MOCK_DATA.usuarios.push(userData);
        }
        fetchUsuarios();
    };

    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const filteredUsuarios = usuarios.filter(u =>
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

    return (
        <div>
            <UsuarioModal show={isModalOpen} onClose={handleCloseModal} onSave={handleSaveUser} userData={editingUser} />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h1>
                    <p className="mt-1 text-gray-600">Administra las cuentas y permisos del personal.</p>
                </div>
                <Button onClick={() => handleOpenModal()}><PlusCircle className="w-5 h-5 mr-2" /> Nuevo Usuario</Button>
            </div>

            <Card className="mt-8">
                <div className="flex justify-between items-center mb-4">
                     <div className="relative w-full max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="block w-full pl-10 pr-3 py-2 border-none bg-slate-100 rounded-lg shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_#ffffff]"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><SkeletonLoader className="h-4 w-12" /></td>
                                    </tr>
                                ))
                            ) : (
                                currentItems.map(user => (
                                    <tr key={user.id_usuario}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.apellido}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.login}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.privilegios}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-900 transition-colors duration-200">Editar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="py-3 flex items-center justify-between border-t border-slate-200/80 mt-4">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</Button>
                        <Button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Siguiente</Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, filteredUsuarios.length)}</span> de <span className="font-medium">{filteredUsuarios.length}</span> resultados
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md -space-x-px">
                                <Button variant="secondary" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="!rounded-l-full !rounded-r-none">Anterior</Button>
                                <Button variant="secondary" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="!rounded-r-full !rounded-l-none">Siguiente</Button>
                            </nav>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const NotaIngresoPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [formData, setFormData] = useState({
        signosVitales: { TA: '', FC: '', FR: '', Temp: '', SatO2: '' },
        interrogatorio: '',
        exploracionFisica: '',
        planTratamiento: ''
    });
    const pdfRef = useRef();

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            const patData = MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente);
            setPatient(patData);
            if (procData.resumen_ingreso && typeof procData.resumen_ingreso === 'object') {
                setFormData({
                    signosVitales: procData.resumen_ingreso.signosVitales || { TA: '', FC: '', FR: '', Temp: '', SatO2: '' },
                    interrogatorio: procData.resumen_ingreso.interrogatorio || '',
                    exploracionFisica: procData.resumen_ingreso.exploracionFisica || '',
                    planTratamiento: procData.resumen_ingreso.planTratamiento || ''
                });
            }
        }
    }, [procedureId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const vitalSignsKeys = ['TA', 'FC', 'FR', 'Temp', 'SatO2'];
        if (vitalSignsKeys.includes(name)) {
            setFormData(prev => ({
                ...prev,
                signosVitales: {
                    ...prev.signosVitales,
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureId);
        if (index !== -1) {
            MOCK_DATA.procedimientos[index].resumen_ingreso = formData;
        }

        // Generate PDF
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const input = pdfRef.current;
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Nota_Ingreso_${patient.nombre}_${patient.apellido}.pdf`);

        navigateTo('programacion'); // Go back to the main schedule page
    };
    
    if (!procedure || !patient) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    return (
        <div>
            {/* Hidden div for PDF generation */}
            <div style={{ position: 'absolute', left: '-9999px', width: '210mm' }}>
                <div ref={pdfRef} className="p-8 bg-white text-black font-sans">
                    <div className="flex justify-between items-start pb-4 border-b border-gray-300">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Clínica SIC</h1>
                            <p className="text-sm text-gray-600">Dirección de la Clínica, Cancún, Q.Roo</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                            <p><strong>Paciente:</strong> {patient.nombre} {patient.apellido}</p>
                            <p><strong>Edad:</strong> {calcularEdad(patient.fecha_nacimiento)} años</p>
                            <p><strong>Fecha:</strong> {fechaCastellano(new Date())}</p>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-center my-6 text-gray-800">Nota de Ingreso</h2>
                    <div className="space-y-4 text-sm">
                        <p><strong>Diagnóstico:</strong> {procedure.diagnostico}</p>
                        <p><strong>Procedimiento Planeado:</strong> {procedure.qx_planeada}</p>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="font-bold mb-2 text-gray-700">Signos Vitales</h3>
                            <p>TA: {formData.signosVitales.TA} mmHg | FC: {formData.signosVitales.FC} lpm | FR: {formData.signosVitales.FR} rpm | Temp: {formData.signosVitales.Temp} °C | SatO2: {formData.signosVitales.SatO2} %</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="font-bold mb-2 text-gray-700">Resumen del Interrogatorio</h3>
                            <p className="whitespace-pre-wrap">{formData.interrogatorio}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="font-bold mb-2 text-gray-700">Exploración Física</h3>
                            <p className="whitespace-pre-wrap">{formData.exploracionFisica}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="font-bold mb-2 text-gray-700">Plan de Tratamiento</h3>
                            <p className="whitespace-pre-wrap">{formData.planTratamiento}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nota de Ingreso</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Detalles
                </Button>
            </div>
            <Card>
                <form onSubmit={handleSave}>
                    <div className="p-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="diagnostico" label="Diagnóstico" value={procedure.diagnostico} disabled />
                            <Input name="qx_planeada" label="Procedimiento Planeado" value={procedure.qx_planeada} disabled />
                        </div>

                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-sm font-medium text-gray-900 px-2">Signos Vitales</legend>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
                                <Input name="TA" label="TA (mmHg)" value={formData.signosVitales.TA} onChange={handleChange} />
                                <Input name="FC" label="FC (lpm)" value={formData.signosVitales.FC} onChange={handleChange} />
                                <Input name="FR" label="FR (rpm)" value={formData.signosVitales.FR} onChange={handleChange} />
                                <Input name="Temp" label="Temp (°C)" value={formData.signosVitales.Temp} onChange={handleChange} />
                                <Input name="SatO2" label="SatO2 (%)" value={formData.signosVitales.SatO2} onChange={handleChange} />
                            </div>
                        </fieldset>

                        <Textarea name="interrogatorio" label="Resumen del Interrogatorio" value={formData.interrogatorio} onChange={handleChange} rows={5} />
                        <Textarea name="exploracionFisica" label="Exploración Física" value={formData.exploracionFisica} onChange={handleChange} rows={5} />
                        <Textarea name="planTratamiento" label="Plan de Tratamiento" value={formData.planTratamiento} onChange={handleChange} rows={3} />
                    </div>
                    <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                        <Button type="submit">Guardar y Generar PDF</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const ConsentimientoQuirurgicoPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [cirujano, setCirujano] = useState(null);
    const pdfRef = useRef();

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            const patData = MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente);
            setPatient(patData);
            const cirujanoData = MOCK_DATA.usuarios.find(u => u.id_usuario === procData.id_medico);
            setCirujano(cirujanoData);
        }
    }, [procedureId]);

    const handleGeneratePdf = async () => {
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const input = pdfRef.current;
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Consentimiento_Quirurgico_${patient.nombre}_${patient.apellido}.pdf`);
        navigateTo('programacion');
    };

    if (!procedure || !patient || !cirujano) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    const ConsentimientoContent = ({ isPdf = false }) => (
        <div className={`${isPdf ? 'p-8 bg-white text-black font-sans' : 'p-2'}`}>
            <div className={`flex justify-between items-start pb-4 ${isPdf ? 'border-b border-gray-300' : ''}`}>
                <div>
                    <h1 className={`${isPdf ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800`}>Clínica SIC</h1>
                    <p className={`${isPdf ? 'text-sm' : ''} text-gray-600`}>Dirección de la Clínica, Cancún, Q.Roo</p>
                </div>
                <div className={`${isPdf ? 'text-sm' : ''} text-right text-gray-600`}>
                    <p><strong>Paciente:</strong> {patient.nombre} {patient.apellido}</p>
                    <p><strong>Edad:</strong> {calcularEdad(patient.fecha_nacimiento)} años</p>
                    <p><strong>Fecha:</strong> {fechaCastellano(new Date())}</p>
                </div>
            </div>
            <h2 className={`${isPdf ? 'text-xl' : 'text-2xl'} font-bold text-center my-6 text-gray-800`}>Consentimiento Informado Quirúrgico</h2>
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p className="text-xs text-gray-500 text-justify">
                    Fundamentos: Reglamento de la Ley General de Salud en materia de prestación de servicios de atención médica; artículo 80, 81, 82 y 83; Norma Oficial Mexicana, NOM-004-SSA3-2012, del expediente clínico, numerales 4.2, 10.1, 10.1.2, 10.1.3, 10.1.2.3 y NOM 006-SSA3-2011.
                </p>
                <p><strong>Yo como paciente ( ), Familiar ( ), Tutor ( ) o Representante Legal ( )</strong></p>
                <p><strong>Nombre:</strong> _________________________________________________________________</p>
                <p>
                    Manifiesto mi libre voluntad para autorizar los procedimientos diagnósticos, terapéuticos y quirúrgicos que se me indiquen después de haber recibido y entendido la información suficiente, clara, oportuna y veraz sobre mi enfermedad y estado actual; además de los beneficios, riesgos y posibles complicaciones y secuelas inherentes.
                </p>
                <p>
                    Se me han comunicado las alternativas existentes y disponibles, el derecho a cambio de mi decisión en cualquier momento antes del procedimiento o intervención. Me comprometo a proporcionar información completa y veraz, así como seguir las indicaciones médicas con el propósito de que mi atención sea adecuada. Otorgo mi autorización al personal de salud para la atención de contingencias y urgencias derivadas del acto médico-quirúrgico señalado, atendiendo al principio de libertad prescriptiva.
                </p>
                <p>Se me han explicado a detalle todos los <strong>beneficios</strong> y <strong>posibles riesgos</strong> relacionados con su realización que a continuación se mencionan:</p>
                <div className="pl-4">
                    <p><strong className="font-semibold">Riesgos:</strong> {procedure.riesgos || 'No especificados.'}</p>
                    <p><strong className="font-semibold">Beneficios:</strong> {procedure.beneficios || 'No especificados.'}</p>
                </div>
                <p>
                    <strong>Otorgo mi consentimiento</strong> para que se me administre el tipo de anestesia que por mi particular estado de salud y tipo de cirugía a la que seré sometido, se me practiquen de ser necesarios, los procedimientos de monitoreo invasivos intraoperatorios pertinentes (colocación de sondas, catéter venoso central, canalización de línea arterial).
                </p>
                <div className="mt-6 pt-4 border-t">
                    <p><strong>Diagnóstico:</strong> {procedure.diagnostico}</p>
                    <p><strong>Procedimiento Proyectado:</strong> {procedure.qx_planeada}</p>
                </div>
                <div className="mt-20 flex justify-around text-center">
                    <div className="w-1/2">
                        <div className="border-t border-gray-400 pt-2">
                            <p>Paciente, Familiar o Representante Legal</p>
                        </div>
                    </div>
                    <div className="w-1/2">
                        <div className="border-t border-gray-400 pt-2">
                            <p>{formatMedicoName(cirujano)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ position: 'absolute', left: '-9999px', width: '210mm' }}>
                <div ref={pdfRef}>
                    <ConsentimientoContent isPdf={true} />
                </div>
            </div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Consentimiento Quirúrgico</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Detalles
                </Button>
            </div>
            <Card>
                <ConsentimientoContent />
                <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="button" onClick={handleGeneratePdf}>Generar PDF y Volver</Button>
                </div>
            </Card>
        </div>
    );
};

const ConsentimientoAnestesicoPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [anestesiologo, setAnestesiologo] = useState(null);
    const pdfRef = useRef(null);

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            const patData = MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente);
            setPatient(patData);
            const anestesiologoData = MOCK_DATA.usuarios.find(u => u.id_usuario === procData.qx_anestesiologo);
            setAnestesiologo(anestesiologoData);
        }
    }, [procedureId]);

    const handleGeneratePdf = async () => {
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const input = pdfRef.current;
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Consentimiento_Anestesico_${patient.nombre}_${patient.apellido}.pdf`);
        navigateTo('programacion');
    };

    if (!procedure || !patient || !anestesiologo) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    const ConsentimientoContent = ({ isPdf = false }) => (
        <div className={`${isPdf ? 'p-8 bg-white text-black font-sans' : 'p-2'}`}>
             <div className={`flex justify-between items-start pb-4 ${isPdf ? 'border-b border-gray-300' : ''}`}>
                <div>
                    <h1 className={`${isPdf ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800`}>Clínica SIC</h1>
                    <p className={`${isPdf ? 'text-sm' : ''} text-gray-600`}>Dirección de la Clínica, Cancún, Q.Roo</p>
                </div>
                <div className={`${isPdf ? 'text-sm' : ''} text-right text-gray-600`}>
                    <p><strong>Paciente:</strong> {patient.nombre} {patient.apellido}</p>
                    <p><strong>Edad:</strong> {calcularEdad(patient.fecha_nacimiento)} años</p>
                    <p><strong>Fecha:</strong> {fechaCastellano(new Date())}</p>
                </div>
            </div>
            <h2 className={`${isPdf ? 'text-xl' : 'text-2xl'} font-bold text-center my-6 text-gray-800`}>Consentimiento Informado para Anestesia</h2>
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p className="text-xs text-gray-500 text-justify">
                    Fundamentos: Reglamento de la Ley General de Salud en materia de prestación de servicios de atención médica; artículo 80, 81, 82 y 83; Norma Oficial Mexicana, NOM-004-SSA3-2012, del expediente clínico, numerales 4.2, 10.1, 10.1.2, 10.1.3, 10.1.2.3 y NOM 006-SSA3-2011.
                </p>
                <p><strong>Yo como paciente ( ), Familiar ( ), Tutor ( ) o Representante Legal ( )</strong></p>
                <p><strong>Nombre:</strong> _________________________________________________________________</p>
                <p>
                    Expreso mi libre voluntad para autorizar se me realice el procedimiento anestésico y/o analgésico requerido.
                </p>
                 <p>
                    Se me ha explicado de forma clara y con lenguaje sencillo todo lo que a continuación se detalla en lenguaje técnico. He comprendido satisfactoriamente la naturaleza y propósito de la técnica de anestesia a la que me debo someter a efectos de ser intervenido quirúrgicamente, así como la probabilidad de cambio de técnica durante el mismo procedimiento quirúrgico si fuese necesario. Se me ha dado la oportunidad de discutir, preguntar y aclarar todas mis dudas sobre riesgos, beneficios y alternativas relacionadas con la anestesia y su técnica requerida, y aclaro que todas ellas han sido abordadas de manera satisfactoria.
                </p>
                <p>
                    <strong className="font-semibold">Riesgos:</strong> Se me han explicado los posibles riesgos, incluyendo pero no limitado a: lesiones en la vía aérea, efectos adversos a medicamentos, cefalea, lesiones nerviosas, paro cardiorrespiratorio y muerte.
                </p>
                <div className="mt-6 pt-4 border-t">
                    <p><strong>Diagnóstico:</strong> {procedure.diagnostico}</p>
                    <p><strong>Procedimiento Proyectado:</strong> {procedure.qx_planeada}</p>
                </div>
                <div className="mt-20 space-y-10 text-center">
                    <div className="flex justify-around">
                        <div className="w-1/2"><div className="border-t border-gray-400 pt-2 mx-4"><p>Paciente, Familiar o Representante Legal</p></div></div>
                        <div className="w-1/2"><div className="border-t border-gray-400 pt-2 mx-4"><p>Testigo</p></div></div>
                    </div>
                    <div className="flex justify-around">
                        <div className="w-1/2"><div className="border-t border-gray-400 pt-2 mx-4"><p>{formatMedicoName(anestesiologo)}</p></div></div>
                        <div className="w-1/2"><div className="border-t border-gray-400 pt-2 mx-4"><p>Testigo</p></div></div>
                    </div>
                </div>
            </div>
        </div>
    );

     return (
        <div>
            <div style={{ position: 'absolute', left: '-9999px', width: '210mm' }}>
                <div ref={pdfRef}>
                    <ConsentimientoContent isPdf={true} />
                </div>
            </div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Consentimiento Anestésico</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Detalles
                </Button>
            </div>
            <Card>
                <ConsentimientoContent />
                <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="button" onClick={handleGeneratePdf}>Generar PDF y Volver</Button>
                </div>
            </Card>
        </div>
    );
};

const NotaPreanestesicaPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [formData, setFormData] = useState(null);
    const pdfRef = useRef();

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            const patData = MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente);
            setPatient(patData);
            
            const initialData = JSON.parse(JSON.stringify(procData.notaPreanestesica || {}));
            const defaults = {
                antecedentes: { tabaquismo: '', alcoholismo: '', toxicomanias: '', ejercicio: '', asma: '', alergias: '', cardiovascular: '', pulmonar: '', endocrinologico: '', antecedentes_anestesicos: '', antecedentes_quirurgicos: '' },
                exploracion: { peso: '', talla: '', TA: '', FC: '', FR: '', Temp: '', SatO2: '', tegumentos: '', cabeza: '', traquea: '', CP: '', cardio: '', extremidades: '' },
                viaAerea: { mallampati: '', aldreti: '', bellhouseDore: '', interincisiva: '', outras: '' },
                laboratorio: { hb: '', hct: '', leucos: '', plaquetas: '', glucosa: '', creatinina: '', bun: '', urea: '', tp: '', ttp: '', inr: '' },
                ekg: '',
                planAnestesico: { valoraciones: '', plan: '', indicaciones: '' }
            };
            
            for (const section in defaults) {
                if (typeof defaults[section] === 'object' && defaults[section] !== null && !Array.isArray(defaults[section])) {
                    initialData[section] = { ...defaults[section], ...(initialData[section] || {}) };
                } else {
                    if (typeof initialData[section] === 'undefined') {
                        initialData[section] = defaults[section];
                    }
                }
            }

            setFormData(initialData);
        }
    }, [procedureId]);

    const handleChange = (e) => {
        const { name, value, dataset } = e.target;
        const { section, field } = dataset;

        setFormData(prev => {
            const newFormData = { ...prev };
            if (section) {
                newFormData[section] = { ...newFormData[section], [field]: value };
            } else {
                newFormData[name] = value;
            }
            return newFormData;
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureId);
        if (index !== -1) {
            MOCK_DATA.procedimientos[index].notaPreanestesica = formData;
        }
        
        // PDF Generation logic
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const input = pdfRef.current;
        const canvas = await html2canvas(input, { scale: 2, logging: false, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Nota_Preanestesica_${patient.nombre}_${patient.apellido}.pdf`);

        navigateTo('programacion');
    };

    if (!formData || !patient || !procedure) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    const PdfContent = () => (
        <div className="p-8 bg-white text-black font-sans text-xs">
            <div className="flex justify-between items-start pb-4 border-b border-gray-300">
                <div>
                    <h1 className="text-xl font-bold">Clínica SIC</h1>
                    <p>Dirección de la Clínica, Cancún, Q.Roo</p>
                </div>
                <div className="text-right">
                    <p><strong>Paciente:</strong> {patient.nombre} {patient.apellido}</p>
                    <p><strong>Edad:</strong> {calcularEdad(patient.fecha_nacimiento)} años</p>
                    <p><strong>Fecha:</strong> {fechaCastellano(new Date())}</p>
                </div>
            </div>
            <h2 className="text-lg font-bold text-center my-4">Nota de Valoración Pre-Anestésica</h2>
            <div className="space-y-3">
                <p><strong>Diagnóstico:</strong> {procedure.diagnostico}</p>
                <p><strong>Procedimiento Planeado:</strong> {procedure.qx_planeada}</p>
                
                <h3 className="font-bold pt-2 border-t mt-2">Antecedentes</h3>
                <p><strong>Alergias:</strong> {formData.antecedentes.alergias}</p>
                <p><strong>Cardiovascular:</strong> {formData.antecedentes.cardiovascular}</p>
                <p><strong>Anestésicos Previos:</strong> {formData.antecedentes.antecedentes_anestesicos}</p>
                <p><strong>Quirúrgicos Previos:</strong> {formData.antecedentes.antecedentes_quirurgicos}</p>

                <h3 className="font-bold pt-2 border-t mt-2">Exploración Física</h3>
                <p><strong>Peso:</strong> {formData.exploracion.peso} kg, <strong>Talla:</strong> {formData.exploracion.talla} cm</p>
                <p><strong>Signos Vitales:</strong> TA: {formData.exploracion.TA}, FC: {formData.exploracion.FC}, FR: {formData.exploracion.FR}, Temp: {formData.exploracion.Temp}, SatO2: {formData.exploracion.SatO2}</p>
                
                <h3 className="font-bold pt-2 border-t mt-2">Vía Aérea</h3>
                <p><strong>Mallampati:</strong> {formData.viaAerea.mallampati}, <strong>Aldreti:</strong> {formData.viaAerea.aldreti}, <strong>Bellhouse-Dore:</strong> {formData.viaAerea.bellhouseDore}, <strong>Interincisiva:</strong> {formData.viaAerea.interincisiva} cm</p>

                <h3 className="font-bold pt-2 border-t mt-2">Laboratorio y Gabinete</h3>
                <p><strong>Hb:</strong> {formData.laboratorio.hb}, <strong>Hct:</strong> {formData.laboratorio.hct}, <strong>Plaquetas:</strong> {formData.laboratorio.plaquetas}, <strong>Glucosa:</strong> {formData.laboratorio.glucosa}, <strong>TP:</strong> {formData.laboratorio.tp}, <strong>TTP:</strong> {formData.laboratorio.ttp}</p>
                <p><strong>EKG:</strong> {formData.ekg}</p>
                
                <h3 className="font-bold pt-2 border-t mt-2">Plan Anestésico</h3>
                <p><strong>Valoraciones:</strong> {formData.planAnestesico.valoraciones}</p>
                <p><strong>Plan:</strong> {formData.planAnestesico.plan}</p>
                <p><strong>Indicaciones:</strong> {formData.planAnestesico.indicaciones}</p>
            </div>
        </div>
    );

    return (
        <div>
             <div style={{ position: 'absolute', left: '-9999px', width: '210mm' }}>
                <div ref={pdfRef}><PdfContent /></div>
            </div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nota Preanestésica</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Detalles
                </Button>
            </div>
            <Card>
                <form onSubmit={handleSave}>
                    <div className="p-2 space-y-6">
                        {/* Antecedentes */}
                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-base font-medium text-gray-900 px-2">Antecedentes</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                {Object.entries(formData.antecedentes).map(([key, value]) => (
                                    <Input key={key} id={`ant-${key}`} label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} data-section="antecedentes" data-field={key} value={value} onChange={handleChange} />
                                ))}
                            </div>
                        </fieldset>

                        {/* Exploración */}
                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-base font-medium text-gray-900 px-2">Exploración Física</legend>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                                {Object.entries(formData.exploracion).map(([key, value]) => (
                                    <Input key={key} id={`exp-${key}`} label={key.toUpperCase()} data-section="exploracion" data-field={key} value={value} onChange={handleChange} />
                                ))}
                            </div>
                        </fieldset>

                        {/* Vía Aérea */}
                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-base font-medium text-gray-900 px-2">Vía Aérea</legend>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
                                {Object.entries(formData.viaAerea).map(([key, value]) => (
                                    <Input key={key} id={`via-${key}`} label={key.charAt(0).toUpperCase() + key.slice(1)} data-section="viaAerea" data-field={key} value={value} onChange={handleChange} />
                                ))}
                            </div>
                        </fieldset>

                        {/* Laboratorio */}
                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-base font-medium text-gray-900 px-2">Laboratorio</legend>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
                                {Object.entries(formData.laboratorio).map(([key, value]) => (
                                    <Input key={key} id={`lab-${key}`} label={key.toUpperCase()} data-section="laboratorio" data-field={key} value={value} onChange={handleChange} />
                                ))}
                            </div>
                        </fieldset>
                        
                        <Textarea name="ekg" label="EKG" value={formData.ekg} onChange={handleChange} rows={2} />

                        {/* Plan Anestésico */}
                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-base font-medium text-gray-900 px-2">Plan Anestésico</legend>
                             <div className="space-y-4 mt-2">
                                <Textarea id="plan-val" label="Valoraciones" data-section="planAnestesico" data-field="valoraciones" value={formData.planAnestesico.valoraciones} onChange={handleChange} rows={2} />
                                <Textarea id="plan-plan" label="Plan" data-section="planAnestesico" data-field="plan" value={formData.planAnestesico.plan} onChange={handleChange} rows={3} />
                                <Textarea id="plan-ind" label="Indicaciones" data-section="planAnestesico" data-field="indicaciones" value={formData.planAnestesico.indicaciones} onChange={handleChange} rows={2} />
                            </div>
                        </fieldset>

                    </div>
                    <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                        <Button type="submit">Guardar y Generar PDF</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const NotaPostanestesicaPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [formData, setFormData] = useState(null);
    const pdfRef = useRef();

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            const patData = MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente);
            setPatient(patData);
            
            const initialData = JSON.parse(JSON.stringify(procData.notaPostanestesica || {}));
            const defaults = {
                tecnica_anestesica: '',
                liquidos: '',
                inicio_anestesia: '',
                termino_anestesia: '',
                inicio_cirugia: '',
                termino_cirugia: '',
                signosVitalesIngresoUCPA: { TA: '', FC: '', FR: '', Temp: '', SatO2: '' },
                signosVitalesAltaUCPA: { TA: '', FC: '', FR: '', Temp: '', SatO2: '' },
                signosVitalesAltaAnestesio: { TA: '', FC: '', FR: '', Temp: '', SatO2: '' },
                indicaciones_altaAnestesio: ''
            };
            
            const mergedData = { ...defaults, ...initialData };
            mergedData.signosVitalesIngresoUCPA = { ...defaults.signosVitalesIngresoUCPA, ...initialData.signosVitalesIngresoUCPA };
            mergedData.signosVitalesAltaUCPA = { ...defaults.signosVitalesAltaUCPA, ...initialData.signosVitalesAltaUCPA };
            mergedData.signosVitalesAltaAnestesio = { ...defaults.signosVitalesAltaAnestesio, ...initialData.signosVitalesAltaAnestesio };

            setFormData(mergedData);
        }
    }, [procedureId]);

    const handleChange = (e) => {
        const { name, value, dataset } = e.target;
        const { section } = dataset;

        setFormData(prev => {
            const newFormData = { ...prev };
            if (section) {
                newFormData[section] = { ...newFormData[section], [name]: value };
            } else {
                newFormData[name] = value;
            }
            return newFormData;
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureId);
        if (index !== -1) {
            MOCK_DATA.procedimientos[index].notaPostanestesica = formData;
        }
        
        // PDF Generation logic
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const input = pdfRef.current;
        if (!input) {
            console.error("PDF content element not found.");
            return;
        }
        const canvas = await html2canvas(input, { scale: 2, logging: false, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Nota_Postanestesica_${patient.nombre}_${patient.apellido}.pdf`);

        navigateTo('programacion');
    };

    if (!formData || !patient || !procedure) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    const PdfContent = () => (
        <div className="p-8 bg-white text-black font-sans text-xs">
            <div className="flex justify-between items-start pb-4 border-b border-gray-300">
                <div>
                    <h1 className="text-xl font-bold">Clínica SIC</h1>
                    <p>Dirección de la Clínica, Cancún, Q.Roo</p>
                </div>
                <div className="text-right">
                    <p><strong>Paciente:</strong> {patient.nombre} {patient.apellido}</p>
                    <p><strong>Edad:</strong> {calcularEdad(patient.fecha_nacimiento)} años</p>
                    <p><strong>Fecha:</strong> {fechaCastellano(new Date())}</p>
                </div>
            </div>
            <h2 className="text-lg font-bold text-center my-4">Nota Post-Anestésica</h2>
             <div className="space-y-3">
                <p><strong>Diagnóstico:</strong> {procedure.diagnostico}</p>
                <p><strong>Procedimiento Realizado:</strong> {procedure.qx_planeada}</p>
                <p><strong>Técnica Anestésica:</strong> {formData.tecnica_anestesica}</p>
                <p><strong>Líquidos Administrados:</strong> {formData.liquidos}</p>
                
                <h3 className="font-bold pt-2 border-t mt-2">Tiempos</h3>
                <p><strong>Inicio Anestesia:</strong> {formData.inicio_anestesia} | <strong>Término Anestesia:</strong> {formData.termino_anestesia}</p>
                <p><strong>Inicio Cirugía:</strong> {formData.inicio_cirugia} | <strong>Término Cirugía:</strong> {formData.termino_cirugia}</p>
                
                <h3 className="font-bold pt-2 border-t mt-2">Signos Vitales</h3>
                <p><strong>Ingreso UCPA:</strong> TA: {formData.signosVitalesIngresoUCPA.TA}, FC: {formData.signosVitalesIngresoUCPA.FC}, FR: {formData.signosVitalesIngresoUCPA.FR}, Temp: {formData.signosVitalesIngresoUCPA.Temp}, SatO2: {formData.signosVitalesIngresoUCPA.SatO2}</p>
                <p><strong>Alta UCPA:</strong> TA: {formData.signosVitalesAltaUCPA.TA}, FC: {formData.signosVitalesAltaUCPA.FC}, FR: {formData.signosVitalesAltaUCPA.FR}, Temp: {formData.signosVitalesAltaUCPA.Temp}, SatO2: {formData.signosVitalesAltaUCPA.SatO2}</p>
                <p><strong>Alta Anestesiología:</strong> TA: {formData.signosVitalesAltaAnestesio.TA}, FC: {formData.signosVitalesAltaAnestesio.FC}, FR: {formData.signosVitalesAltaAnestesio.FR}, Temp: {formData.signosVitalesAltaAnestesio.Temp}, SatO2: {formData.signosVitalesAltaAnestesio.SatO2}</p>
                
                <h3 className="font-bold pt-2 border-t mt-2">Indicaciones</h3>
                <p>{formData.indicaciones_altaAnestesio}</p>
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ position: 'absolute', left: '-9999px', width: '210mm' }}>
                <div ref={pdfRef}><PdfContent /></div>
            </div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nota Postanestésica</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Detalles
                </Button>
            </div>
            <Card>
                <form onSubmit={handleSave}>
                    <div className="p-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Diagnóstico" value={procedure.diagnostico} disabled />
                            <Input label="Fecha del Procedimiento" value={formatDateVerbose(procedure.fecha_qx)} disabled />
                        </div>
                        
                        <Textarea name="tecnica_anestesica" label="Técnica anestésica y fármacos empleados" value={formData.tecnica_anestesica} onChange={handleChange} rows={5} />
                        <Textarea name="liquidos" label="Sangre y/o líquidos administrados" value={formData.liquidos} onChange={handleChange} rows={3} />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Input name="inicio_anestesia" label="Inicio Anestesia" value={formData.inicio_anestesia} onChange={handleChange} placeholder="HH:MM" />
                            <Input name="termino_anestesia" label="Término Anestesia" value={formData.termino_anestesia} onChange={handleChange} placeholder="HH:MM" />
                            <Input name="inicio_cirugia" label="Inicio Cirugía" value={formData.inicio_cirugia} onChange={handleChange} placeholder="HH:MM" />
                            <Input name="termino_cirugia" label="Término Cirugía" value={formData.termino_cirugia} onChange={handleChange} placeholder="HH:MM" />
                        </div>

                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-sm font-medium text-gray-900 px-2">Signos Vitales Ingreso UCPA</legend>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
                                <Input name="TA" data-section="signosVitalesIngresoUCPA" placeholder="TA" value={formData.signosVitalesIngresoUCPA.TA} onChange={handleChange} />
                                <Input name="FC" data-section="signosVitalesIngresoUCPA" placeholder="FC" value={formData.signosVitalesIngresoUCPA.FC} onChange={handleChange} />
                                <Input name="FR" data-section="signosVitalesIngresoUCPA" placeholder="FR" value={formData.signosVitalesIngresoUCPA.FR} onChange={handleChange} />
                                <Input name="Temp" data-section="signosVitalesIngresoUCPA" placeholder="Temp" value={formData.signosVitalesIngresoUCPA.Temp} onChange={handleChange} />
                                <Input name="SatO2" data-section="signosVitalesIngresoUCPA" placeholder="SatO2" value={formData.signosVitalesIngresoUCPA.SatO2} onChange={handleChange} />
                            </div>
                        </fieldset>
                        
                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-sm font-medium text-gray-900 px-2">Signos Vitales Alta UCPA</legend>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
                               <Input name="TA" data-section="signosVitalesAltaUCPA" placeholder="TA" value={formData.signosVitalesAltaUCPA.TA} onChange={handleChange} />
                                <Input name="FC" data-section="signosVitalesAltaUCPA" placeholder="FC" value={formData.signosVitalesAltaUCPA.FC} onChange={handleChange} />
                                <Input name="FR" data-section="signosVitalesAltaUCPA" placeholder="FR" value={formData.signosVitalesAltaUCPA.FR} onChange={handleChange} />
                                <Input name="Temp" data-section="signosVitalesAltaUCPA" placeholder="Temp" value={formData.signosVitalesAltaUCPA.Temp} onChange={handleChange} />
                                <Input name="SatO2" data-section="signosVitalesAltaUCPA" placeholder="SatO2" value={formData.signosVitalesAltaUCPA.SatO2} onChange={handleChange} />
                            </div>
                        </fieldset>

                        <fieldset className="border-none p-4 rounded-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff]">
                            <legend className="text-sm font-medium text-gray-900 px-2">Signos Vitales Alta Anestesiología</legend>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
                                <Input name="TA" data-section="signosVitalesAltaAnestesio" placeholder="TA" value={formData.signosVitalesAltaAnestesio.TA} onChange={handleChange} />
                                <Input name="FC" data-section="signosVitalesAltaAnestesio" placeholder="FC" value={formData.signosVitalesAltaAnestesio.FC} onChange={handleChange} />
                                <Input name="FR" data-section="signosVitalesAltaAnestesio" placeholder="FR" value={formData.signosVitalesAltaAnestesio.FR} onChange={handleChange} />
                                <Input name="Temp" data-section="signosVitalesAltaAnestesio" placeholder="Temp" value={formData.signosVitalesAltaAnestesio.Temp} onChange={handleChange} />
                                <Input name="SatO2" data-section="signosVitalesAltaAnestesio" placeholder="SatO2" value={formData.signosVitalesAltaAnestesio.SatO2} onChange={handleChange} />
                            </div>
                        </fieldset>

                        <Textarea name="indicaciones_altaAnestesio" label="Indicaciones al Alta de Anestesiología" value={formData.indicaciones_altaAnestesio} onChange={handleChange} rows={4} />

                    </div>
                    <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                        <Button type="submit">Guardar y Generar PDF</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const NotaPostoperatoriaPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [medicos, setMedicos] = useState({});
    const [formData, setFormData] = useState({
        diagnostico_postqx: '',
        cirugia_realizada: '',
        tecnica: '',
        hallazgos: '',
        sangrado: '',
        incidentes: '',
        complicaciones: '',
        cuenta_material: '',
        pronostico: '',
        recomendaciones_postop: ''
    });
     const pdfRef = useRef();

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            const patData = MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente);
            setPatient(patData);
             setMedicos({
                cirujano: MOCK_DATA.usuarios.find(u => u.id_usuario === procData.id_medico),
                anestesiologo: MOCK_DATA.usuarios.find(u => u.id_usuario === procData.qx_anestesiologo),
                ayudante: MOCK_DATA.usuarios.find(u => u.id_usuario === procData.id_ayudante),
            });
            setFormData({
                diagnostico_postqx: procData.diagnostico_postqx || procData.diagnostico,
                cirugia_realizada: procData.cirugia_realizada || procData.qx_planeada,
                tecnica: procData.tecnica || '',
                hallazgos: procData.hallazgos || '',
                sangrado: procData.sangrado || '',
                incidentes: procData.incidentes || 'Ninguno',
                complicaciones: procData.complicaciones || '',
                cuenta_material: procData.cuenta_material || '',
                pronostico: procData.pronostico || '',
                recomendaciones_postop: procData.recomendaciones_postop || ''
            });
        }
    }, [procedureId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureId);
        if (index !== -1) {
            MOCK_DATA.procedimientos[index] = { ...MOCK_DATA.procedimientos[index], ...formData };
        }
        
        // PDF Generation
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const input = pdfRef.current;
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Nota_Postoperatoria_${patient.nombre}_${patient.apellido}.pdf`);

        navigateTo('programacion');
    };

    if (!procedure || !patient) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }
    
    const PdfContent = () => (
        <div className="p-8 bg-white text-black font-sans text-xs leading-relaxed">
            <div className="flex justify-between items-start pb-4 border-b border-gray-300">
                <div>
                    <h1 className="text-xl font-bold">Clínica SIC</h1>
                    <p>Dirección de la Clínica, Cancún, Q.Roo</p>
                </div>
                <div className="text-right">
                    <p><strong>Paciente:</strong> {patient.nombre} {patient.apellido}</p>
                    <p><strong>Edad:</strong> {calcularEdad(patient.fecha_nacimiento)} años</p>
                    <p><strong>Fecha Cirugía:</strong> {formatDateVerbose(procedure.fecha_qx)}</p>
                </div>
            </div>
            <h2 className="text-lg font-bold text-center my-4">Nota Postoperatoria</h2>
            <div className="space-y-2">
                <p><strong>Diagnóstico Preoperatorio:</strong> {procedure.diagnostico}</p>
                <p><strong>Diagnóstico Postoperatorio:</strong> {formData.diagnostico_postqx}</p>
                <p><strong>Operación Planeada:</strong> {procedure.qx_planeada}</p>
                <p><strong>Operación Realizada:</strong> {formData.cirugia_realizada}</p>
                <div className="pt-2 mt-2 border-t">
                    <h3 className="font-bold">Descripción de la Técnica Quirúrgica:</h3>
                    <p className="whitespace-pre-wrap">{formData.tecnica}</p>
                </div>
                <div className="pt-2 mt-2 border-t">
                    <h3 className="font-bold">Hallazgos:</h3>
                    <p className="whitespace-pre-wrap">{formData.hallazgos}</p>
                </div>
                <p><strong>Sangrado Estimado:</strong> {formData.sangrado} ml</p>
                <p><strong>Incidentes:</strong> {formData.incidentes}</p>
                <p><strong>Complicaciones:</strong> {formData.complicaciones}</p>
                <p><strong>Cuenta de Material:</strong> {formData.cuenta_material}</p>
                <p><strong>Pronóstico:</strong> {formData.pronostico}</p>
                <div className="pt-2 mt-2 border-t">
                    <h3 className="font-bold">Recomendaciones:</h3>
                    <p className="whitespace-pre-wrap">{formData.recomendaciones_postop}</p>
                </div>
                 <div className="mt-10 flex justify-around text-center">
                    <div className="w-1/3"><div className="border-t border-gray-400 pt-2"><p>{formatMedicoName(medicos.cirujano)}</p><p>Cirujano</p></div></div>
                    <div className="w-1/3"><div className="border-t border-gray-400 pt-2"><p>{formatMedicoName(medicos.ayudante)}</p><p>Ayudante</p></div></div>
                    <div className="w-1/3"><div className="border-t border-gray-400 pt-2"><p>{formatMedicoName(medicos.anestesiologo)}</p><p>Anestesiólogo</p></div></div>
                </div>
            </div>
        </div>
    );


    return (
        <div>
             <div style={{ position: 'absolute', left: '-9999px', width: '210mm' }}>
                <div ref={pdfRef}><PdfContent /></div>
            </div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nota Postoperatoria</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Detalles
                </Button>
            </div>
            <Card>
                <form onSubmit={handleSave}>
                    <div className="p-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="diagnostico" label="Diagnóstico Preoperatorio" value={procedure.diagnostico} disabled />
                            <Input name="qx_planeada" label="Cirugía Planeada" value={procedure.qx_planeada} disabled />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="diagnostico_postqx" label="Diagnóstico Postoperatorio" value={formData.diagnostico_postqx} onChange={handleChange} />
                            <Input name="cirugia_realizada" label="Operación Realizada" value={formData.cirugia_realizada} onChange={handleChange} />
                        </div>
                        <Textarea name="tecnica" label="Descripción de la Técnica Quirúrgica" value={formData.tecnica} onChange={handleChange} rows={6} />
                        <Textarea name="hallazgos" label="Hallazgos" value={formData.hallazgos} onChange={handleChange} rows={4} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="sangrado" label="Sangrado Estimado (ml)" value={formData.sangrado} onChange={handleChange} placeholder="ej. 100" />
                            <Input name="incidentes" label="Incidentes o Accidentes" value={formData.incidentes} onChange={handleChange} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="complicaciones" label="Complicaciones" value={formData.complicaciones} onChange={handleChange} />
                            <Input name="cuenta_material" label="Cuenta de Material" value={formData.cuenta_material} onChange={handleChange} />
                        </div>
                        <Input name="pronostico" label="Pronóstico" value={formData.pronostico} onChange={handleChange} />
                        <Textarea name="recomendaciones_postop" label="Recomendaciones" value={formData.recomendaciones_postop} rows={4} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80">
                             <Input name="cirujano" label="Cirujano" value={formatMedicoName(medicos.cirujano)} disabled />
                             <Input name="ayudante" label="Ayudante" value={formatMedicoName(medicos.ayudante)} disabled />
                             <Input name="anestesiologo" label="Anestesiólogo" value={formatMedicoName(medicos.anestesiologo)} disabled />
                        </div>
                    </div>
                    <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                        <Button type="submit">Guardar y Generar PDF</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const IndicacionesPostoperatoriasPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [formData, setFormData] = useState({
        soluciones_dieta: '',
        medicamentos: '',
        examenes: '',
        actividades_enfermeria: ''
    });
    const pdfRef = useRef();

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            setPatient(MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente));
            // Check for the new detailed object, otherwise provide empty strings
            if (procData.indicaciones_postop && typeof procData.indicaciones_postop === 'object') {
                 setFormData(procData.indicaciones_postop);
            }
        }
    }, [procedureId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureId);
        if (index !== -1) {
            // Save the entire object
            MOCK_DATA.procedimientos[index].indicaciones_postop = formData;
        }

        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const input = pdfRef.current;
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Indicaciones_Postoperatorias_${patient.nombre}.pdf`);
        navigateTo('programacion');
    };

    if (!procedure || !patient) return <LoaderCircle className="w-12 h-12 animate-spin text-blue-600" />;

    const cirujano = MOCK_DATA.usuarios.find(u => u.id_usuario === procedure.id_medico);
    const cirujanoInfo = MOCK_DATA.medicos.find(m => m.id_usuario === cirujano?.id_usuario);

    const PdfContent = () => (
        <div className="p-8 bg-white text-black font-sans text-xs">
            <div className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-xl font-bold">Clínica SIC</h1>
                    <p>Dirección de la Clínica, Cancún, Q.Roo</p>
                </div>
                <div className="text-right">
                    <p><strong>Paciente:</strong> {patient.nombre} {patient.apellido}</p>
                    <p><strong>Fecha:</strong> {fechaCastellano(new Date())}</p>
                </div>
            </div>
            <h2 className="text-lg font-bold text-center my-4">Indicaciones Postoperatorias</h2>
            <div className="space-y-3">
                <div><h3 className="font-bold">Soluciones / Dieta:</h3><p className="whitespace-pre-wrap pl-2">{formData.soluciones_dieta}</p></div>
                <div><h3 className="font-bold">Medicamentos:</h3><p className="whitespace-pre-wrap pl-2">{formData.medicamentos}</p></div>
                <div><h3 className="font-bold">Exámenes de Laboratorio / Gabinete:</h3><p className="whitespace-pre-wrap pl-2">{formData.examenes}</p></div>
                <div><h3 className="font-bold">Actividades de Enfermería:</h3><p className="whitespace-pre-wrap pl-2">{formData.actividades_enfermeria}</p></div>
            </div>
            <div style={{ marginTop: '100px', textAlign: 'center', borderTop: '1px solid black', paddingTop: '5px', width: '50%', margin: '100px auto 0' }}>
                <p style={{margin:0}}>{formatMedicoName(cirujano)}</p>
                <p style={{margin:0}}>C.P. {cirujanoInfo?.cedula}</p>
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ position: 'absolute', left: '-9999px', width: '210mm' }}><div ref={pdfRef}><PdfContent /></div></div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Indicaciones Postoperatorias</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Volver</Button>
            </div>
            <Card>
                <form onSubmit={handleSave}>
                    <div className="p-2 space-y-6">
                        <Textarea name="soluciones_dieta" label="Soluciones / Dieta" value={formData.soluciones_dieta} onChange={handleChange} rows={5} />
                        <Textarea name="medicamentos" label="Medicamentos" value={formData.medicamentos} onChange={handleChange} rows={5} />
                        <Textarea name="examenes" label="Exámenes de Laboratorio / Gabinete" value={formData.examenes} onChange={handleChange} rows={5} />
                        <Textarea name="actividades_enfermeria" label="Actividades de Enfermería" value={formData.actividades_enfermeria} onChange={handleChange} rows={5} />
                    </div>
                    <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                        <Button type="submit">Guardar y Generar PDF</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const NotaDeAltaPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [formData, setFormData] = useState({
        fecha_egreso: getTodayDateString(),
        dx_egreso: '',
        motivo_egreso: 'mejoria',
        resumen_egreso: '',
        indicaciones_egreso: ''
    });
    const pdfRef = useRef();

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            setPatient(MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente));
            if (procData.nota_de_alta) {
                setFormData(procData.nota_de_alta);
            } else {
                setFormData(prev => ({...prev, dx_egreso: procData.diagnostico_postqx || procData.diagnostico}));
            }
        }
    }, [procedureId]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureId);
        if (index !== -1) {
            MOCK_DATA.procedimientos[index].nota_de_alta = formData;
        }

        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const input = pdfRef.current;
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, 0);
        pdf.save(`Nota_de_Alta_${patient.nombre}.pdf`);
        navigateTo('programacion');
    };

    if (!procedure || !patient) return <LoaderCircle className="w-12 h-12 animate-spin text-blue-600" />;

    const cirujano = MOCK_DATA.usuarios.find(u => u.id_usuario === procedure.id_medico);
    const cirujanoInfo = MOCK_DATA.medicos.find(m => m.id_usuario === cirujano?.id_usuario);

    const PdfContent = () => (
         <div className="p-8 bg-white text-black font-sans text-sm leading-relaxed">
            <div className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-xl font-bold">Clínica SIC</h1>
                    <p>Dirección de la Clínica, Cancún, Q.Roo</p>
                </div>
                <div className="text-right">
                    <p><strong>Paciente:</strong> {patient.nombre} {patient.apellido}</p>
                    <p><strong>Fecha de Ingreso:</strong> {formatDateVerbose(procedure.fecha_qx)}</p>
                    <p><strong>Fecha de Egreso:</strong> {formatDateVerbose(formData.fecha_egreso)}</p>
                </div>
            </div>
            <h2 className="text-lg font-bold text-center my-6">Nota de Alta</h2>
            <div className="space-y-3">
                <p><strong>Diagnóstico de Ingreso:</strong> {procedure.diagnostico}</p>
                <p><strong>Diagnóstico de Egreso:</strong> {formData.dx_egreso}</p>
                <p><strong>Motivo de Egreso:</strong> {formData.motivo_egreso}</p>
                <div className="pt-2 mt-2 border-t">
                    <h3 className="font-bold">Resumen Clínico:</h3>
                    <p className="whitespace-pre-wrap">{formData.resumen_egreso}</p>
                </div>
                <div className="pt-2 mt-2 border-t">
                    <h3 className="font-bold">Indicaciones:</h3>
                    <p className="whitespace-pre-wrap">{formData.indicaciones_egreso}</p>
                </div>
            </div>
            <div style={{ marginTop: '100px', textAlign: 'center', borderTop: '1px solid black', paddingTop: '5px', width: '50%', margin: '100px auto 0' }}>
                <p style={{margin:0}}>{formatMedicoName(cirujano)}</p>
                <p style={{margin:0}}>C.P. {cirujanoInfo?.cedula}</p>
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ position: 'absolute', left: '-9999px', width: '210mm' }}><div ref={pdfRef}><PdfContent /></div></div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nota de Alta</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Volver</Button>
            </div>
            <Card>
                <form onSubmit={handleSave}>
                    <div className="p-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Fecha de Ingreso" value={formatDateVerbose(procedure.fecha_qx)} disabled />
                            <Input name="fecha_egreso" label="Fecha de Egreso" type="date" value={formData.fecha_egreso} onChange={handleChange} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Diagnóstico de Ingreso" value={procedure.diagnostico} disabled />
                            <Input name="dx_egreso" label="Diagnóstico de Egreso" value={formData.dx_egreso} onChange={handleChange} />
                        </div>
                        <Select name="motivo_egreso" label="Motivo de Alta" value={formData.motivo_egreso} onChange={handleChange}>
                            <option value="mejoria">Mejoría Clínica</option>
                            <option value="alta_voluntaria">Alta Voluntaria</option>
                            <option value="traslado">Traslado a otro centro</option>
                            <option value="motivos_administrativos">Motivos Administrativos</option>
                            <option value="alta_contra_consejo_medico">Alta contra consejo médico</option>
                            <option value="defuncion">Defunción</option>
                        </Select>
                        <Textarea name="resumen_egreso" label="Resumen Clínico" value={formData.resumen_egreso} onChange={handleChange} rows={5} />
                        <Textarea name="indicaciones_egreso" label="Indicaciones" value={formData.indicaciones_egreso} onChange={handleChange} rows={5} />
                    </div>
                    <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                        <Button type="submit">Guardar y Generar PDF</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const AgregarFotoPage = ({ procedureId, onBack, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            setPatient(MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente));
        }
    }, [procedureId]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!imagePreview) {
            // In a real app, show a proper notification
            console.error("Por favor, seleccione una imagen.");
            return;
        }
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureId);
        if (index !== -1) {
            const newPhoto = {
                url: imagePreview, // In a real app, this would be the URL after uploading to a server
                description: description,
            };
            if (!MOCK_DATA.procedimientos[index].fotos) {
                MOCK_DATA.procedimientos[index].fotos = [];
            }
            MOCK_DATA.procedimientos[index].fotos.push(newPhoto);
        }
        navigateTo('procedimientoDetail', { procedureId });
    };

    if (!procedure || !patient) return <LoaderCircle className="w-12 h-12 animate-spin text-blue-600" />;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Agregar Foto al Expediente</h1>
                    <p className="mt-1 text-gray-600">Paciente: {patient.nombre} {patient.apellido}</p>
                </div>
                <Button variant="secondary" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Volver</Button>
            </div>
            <Card>
                <form onSubmit={handleSave}>
                    <div className="p-2 space-y-6">
                        <div 
                            className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 cursor-pointer hover:bg-slate-200/50"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Vista previa" className="max-h-full max-w-full object-contain rounded-md" />
                            ) : (
                                <span>Haz clic aquí para seleccionar una imagen</span>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Textarea 
                            name="description" 
                            label="Descripción de la foto (opcional)" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            rows={3} 
                        />
                    </div>
                     <div className="p-4 mt-4 bg-slate-100/80 -m-6 mb-0 rounded-b-lg flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                        <Button type="submit" disabled={!imagePreview}>Guardar Foto</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const ProcedimientoDetailPage = ({ procedureId, navigateTo }) => {
    const [procedure, setProcedure] = useState(null);
    const [patient, setPatient] = useState(null);
    const [medicos, setMedicos] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
    
    // Local state for all editable procedure fields
    const [editableProcedure, setEditableProcedure] = useState(null);

    useEffect(() => {
        const procData = MOCK_DATA.procedimientos.find(p => p.id_procedimiento === procedureId);
        if (procData) {
            setProcedure(procData);
            setEditableProcedure(procData); // Initialize editable state
            const patData = MOCK_DATA.pacientes.find(p => p.id_paciente === procData.id_paciente);
            setPatient(patData);
            setMedicos({
                cirujano: MOCK_DATA.usuarios.find(u => u.id_usuario === procData.id_medico),
                anestesiologo: MOCK_DATA.usuarios.find(u => u.id_usuario === procData.qx_anestesiologo),
                ayudante: MOCK_DATA.usuarios.find(u => u.id_usuario === procData.id_ayudante),
            });
        }
    }, [procedureId]);
    
    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setEditableProcedure(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = () => {
        const index = MOCK_DATA.procedimientos.findIndex(p => p.id_procedimiento === procedureId);
        if (index !== -1) {
            MOCK_DATA.procedimientos[index] = editableProcedure;
            setProcedure(editableProcedure); // Update the main procedure state
            
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
    };
    
    const handleSelectDocument = (docType) => {
        setIsDocsModalOpen(false); // Close the modal first
        navigateTo(docType, { procedureId });
    };

    if (!editableProcedure || !patient) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    return (
        <div>
            <DocumentSelectionModal
                show={isDocsModalOpen}
                onClose={() => setIsDocsModalOpen(false)}
                onSelectDocument={handleSelectDocument}
                procedure={procedure}
            />
            
            <Button variant="secondary" onClick={() => navigateTo('programacion')} className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Programación
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h2 className="text-xl font-bold mb-4 tracking-tight">Información del Paciente</h2>
                        <p><strong>Nombre:</strong> {patient.nombre} {patient.apellido}</p>
                        <p><strong>Edad:</strong> {calcularEdad(patient.fecha_nacimiento)} años</p>
                        <p><strong>Fecha de Nacimiento:</strong> {formatDateVerbose(patient.fecha_nacimiento)}</p>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold mb-4 tracking-tight">Detalles del Procedimiento</h2>
                        <p><strong>Diagnóstico:</strong> {procedure.diagnostico}</p>
                        <p><strong>Cirugía Planeada:</strong> {procedure.qx_planeada}</p>
                        <p><strong>Fecha:</strong> {formatDateVerbose(procedure.fecha_qx)}</p>
                        <hr className="my-4 border-slate-200/80" />
                        <p><strong>Cirujano:</strong> {formatMedicoName(medicos.cirujano)}</p>
                        <p><strong>Anestesiólogo:</strong> {formatMedicoName(medicos.anestesiologo)}</p>
                        <p><strong>Ayudante:</strong> {formatMedicoName(medicos.ayudante)}</p>
                    </Card>
                     <Card>
                        <h2 className="text-xl font-bold mb-4 tracking-tight">Estado del Procedimiento</h2>
                        <Select name="status" value={editableProcedure.status} onChange={handleFieldChange}>
                            <option value="Programado">Programado</option>
                            <option value="Post-op">Post-operatorio</option>
                            <option value="Alta">Alta</option>
                        </Select>
                        <Button className="w-full mt-4" onClick={handleSaveChanges}>
                            {showSuccess ? (
                                <> <CheckCircle className="w-5 h-5 mr-2" /> Guardado </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </Button>
                    </Card>
                    <Card>
                        <Button className="w-full" variant="secondary" onClick={() => setIsDocsModalOpen(true)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Generar / Imprimir Documentos
                        </Button>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h2 className="text-xl font-bold mb-4 tracking-tight">Resumen de Notas Clínicas</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-800">Nota de Ingreso</h3>
                                <p className="text-sm text-gray-600 truncate">{procedure.resumen_ingreso?.interrogatorio || 'No registrada.'}</p>
                            </div>
                            <hr className="border-slate-200/80"/>
                            <div>
                                <h3 className="font-semibold text-gray-800">Nota Preanestésica</h3>
                                <p className="text-sm text-gray-600 truncate">{procedure.notaPreanestesica?.planAnestesico?.plan || 'No registrada.'}</p>
                            </div>
                             <hr className="border-slate-200/80"/>
                            <div>
                                <h3 className="font-semibold text-gray-800">Nota Postoperatoria</h3>
                                <p className="text-sm text-gray-600 truncate">{procedure.tecnica || 'No registrada.'}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold mb-4 tracking-tight">Galería de Fotos</h2>
                        {procedure.fotos && procedure.fotos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {procedure.fotos.map((foto, index) => (
                                    <div key={index}>
                                        <img src={foto.url} alt={foto.description || `Foto ${index + 1}`} className="rounded-lg w-full h-40 object-cover" />
                                        <p className="text-sm text-gray-600 mt-2">{foto.description}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No hay fotos para este procedimiento.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};


// Main App Component
// ====================================================================================

const App = () => {
  const { isAuthenticated, user } = useAuth();
  
  const getInitialView = (role) => {
    return 'programacion';
  };

  const [viewState, setViewState] = useState({
      current: 'programacion',
      params: null,
  });

  useEffect(() => {
      if(user) {
          setViewState({ current: getInitialView(user.privilegios), params: null });
      }
  }, [user]);

  useEffect(() => {
      // Add external scripts and fonts
      const jspdfScript = document.createElement('script');
      jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      jspdfScript.async = true;
      document.head.appendChild(jspdfScript);

      const html2canvasScript = document.createElement('script');
      html2canvasScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      html2canvasScript.async = true;
      document.head.appendChild(html2canvasScript);

      const fontLink = document.createElement('link');
      fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);

      return () => {
          document.head.removeChild(jspdfScript);
          document.head.removeChild(html2canvasScript);
          document.head.removeChild(fontLink);
      }
  }, []);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const navigateTo = (view, params = null) => {
      setViewState({ current: view, params: params });
  };

  const renderView = () => {
    const commonProps = {
        procedureId: viewState.params?.procedureId,
        onBack: () => navigateTo('procedimientoDetail', { procedureId: viewState.params?.procedureId }),
        navigateTo: navigateTo,
    };

    switch (viewState.current) {
      case 'programacion':
        return <ProgramacionDiaPage onSelectProcedure={(id, targetView = 'procedimientoDetail') => navigateTo(targetView, { procedureId: id })} />;
      case 'pacientes':
        return <PacientesPage onSelectProcedure={(id) => navigateTo('procedimientoDetail', { procedureId: id })} />;
      case 'usuarios':
        return <UsuariosPage />;
      case 'procedimientoDetail':
        return <ProcedimientoDetailPage procedureId={viewState.params.procedureId} navigateTo={navigateTo} />;
      case 'notaIngreso':
        return <NotaIngresoPage {...commonProps} />;
      case 'consentimientoQuirurgico':
        return <ConsentimientoQuirurgicoPage {...commonProps} />;
      case 'consentimientoAnestesico':
        return <ConsentimientoAnestesicoPage {...commonProps} />;
      case 'notaPreanestesica':
        return <NotaPreanestesicaPage {...commonProps} />;
      case 'notaPostanestesica':
        return <NotaPostanestesicaPage {...commonProps} />;
      case 'notaPostoperatoria':
        return <NotaPostoperatoriaPage {...commonProps} />;
      case 'indicacionesPostoperatorias':
        return <IndicacionesPostoperatoriasPage {...commonProps} />;
       case 'notaDeAlta':
        return <NotaDeAltaPage {...commonProps} />;
       case 'agregarFoto':
        return <AgregarFotoPage {...commonProps} />;
      default:
        return <ProgramacionDiaPage onSelectProcedure={(id) => navigateTo('procedimientoDetail', { procedureId: id })} />;
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-100 text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar currentView={viewState.current} setView={navigateTo} />
      <main className="flex-1 p-8 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

// Root Component
// ====================================================================================

export default function SicApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
