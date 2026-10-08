'use client';

import { useState, useEffect } from 'react';

export default function DevOpsDashboard() {
    const [notas, setNotas] = useState([]);
    const [titulo, setTitulo] = useState('');
    const [logs, setLogs] = useState([]);
    const [salud, setSalud] = useState(null);
    const [cargando, setCargando] = useState(false);

    // Registrar actividad en la consola de telemetría
    const registrarLog = (metodo, ruta, status, duracion, payload, respuesta) => {
        const nuevoLog = {
            id: Date.now() + Math.random(),
            hora: new Date().toLocaleTimeString(),
            metodo,
            ruta,
            status,
            duracion,
            payload,
            respuesta,
        };
        setLogs((prev) => [nuevoLog, ...prev.slice(0, 24)]);
    };

    // Wrapper para solicitudes HTTP
    const peticionHttp = async (metodo, url, data = null) => {
        const inicio = performance.now();
        try {
            const opciones = {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
            };
            if (data) opciones.body = JSON.stringify(data);

            const res = await fetch(url, opciones);
            const resJson = await res.json();
            const duracion = Math.round(performance.now() - inicio);

            registrarLog(metodo, url, res.status, duracion, data, resJson);
            return resJson;
        } catch (err) {
            const duracion = Math.round(performance.now() - inicio);
            registrarLog(metodo, url, 500, duracion, data, { error: err.message });
            return null;
        }
    };

    // Comprobar estado de la BD
    const verificarSalud = async () => {
        const data = await peticionHttp('GET', '/api/salud');
        if (data && data.estado === 'OK') {
            setSalud(data);
        } else {
            setSalud({ estado: 'ERROR', latencia_ms: 0, basedatos: 'Desconectada' });
        }
    };

    // Cargar registros
    const cargarNotas = async () => {
        setCargando(true);
        const res = await peticionHttp('GET', '/api/notas');
        if (Array.isArray(res)) setNotas(res);
        setCargando(false);
    };

    useEffect(() => {
        verificarSalud();
        cargarNotas();
    }, []);

    const crearNota = async (e) => {
        e.preventDefault();
        if (!titulo.trim()) return;
        const res = await peticionHttp('POST', '/api/notas', { titulo: titulo.trim() });
        if (res && res.id) {
            setTitulo('');
            cargarNotas();
        }
    };

    const actualizarEstado = async (id, completada) => {
        await peticionHttp('PUT', `/api/notas/${id}`, { completada: !completada });
        cargarNotas();
    };

    const eliminarNota = async (id) => {
        await peticionHttp('DELETE', `/api/notas/${id}`);
        cargarNotas();
    };

    const pendientes = notas.filter((n) => !n.completada);
    const completadas = notas.filter((n) => n.completada);

    const colorMetodo = {
        GET: '#10b981',
        POST: '#f59e0b',
        PUT: '#3b82f6',
        DELETE: '#ef4444',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#e2e8f0', padding: '1.5rem 1rem' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                {/* ENCABEZADO Y CONTROL DE VERSIÓN (Aquí editarán su nombre en la rama) */}
                <header style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid #1e293b',
                    marginBottom: '1.5rem'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{
                                background: '#6d28d9',
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                letterSpacing: '0.05em'
                            }}>
                                COOLIFY SELF-HOSTED
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>PostgreSQL 16 Alpine</span>
                        </div>
                        {/* Título que modificarán en la práctica */}
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.4rem 0 0 0', color: '#f8fafc' }}>
                            DevNotes - Práctica Coolify de Ricardo Rodríguez Arellano
                        </h1>
                    </div>

                    {/* Widget de Salud de PostgreSQL */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        background: '#111827',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #1f2937'
                    }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: salud?.estado === 'OK' ? '#22c55e' : '#ef4444',
                            boxShadow: salud?.estado === 'OK' ? '0 0 8px #22c55e' : '0 0 8px #ef4444'
                        }} />
                        <div style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 600, color: '#f1f5f9' }}>
                                {salud?.estado === 'OK' ? `BD: ${salud.basedatos}` : 'Sin Conexión BD'}
                            </div>
                            <div style={{ color: '#94a3b8' }}>
                                Latencia: {salud?.latencia_ms ?? '--'} ms
                            </div>
                        </div>
                        <button
                            onClick={verificarSalud}
                            title="Volver a verificar estado"
                            style={{
                                background: 'transparent',
                                border: '1px solid #374151',
                                color: '#9ca3af',
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            Revisar
                        </button>
                    </div>
                </header>

                {/* FORMULARIO DE ENTRADA RÁPIDA */}
                <section style={{
                    background: '#0f172a',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    marginBottom: '1.5rem'
                }}>
                    <form onSubmit={crearNota} style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            type="text"
                            placeholder="Describir nueva tarea o registro..."
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid #334155',
                                background: '#020617',
                                color: '#f8fafc',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: '#7c3aed',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0 1.4rem',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            Crear Registro
                        </button>
                    </form>
                </section>

                {/* TABLERO DE DOS COLUMNAS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                    {/* Columna: En Progreso */}
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1rem', margin: 0, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Tareas Activas</span>
                                <span style={{ background: '#1e3a8a', color: '#bfdbfe', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>
                                    {pendientes.length}
                                </span>
                            </h2>
                        </div>

                        {cargando && <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Cargando registros...</p>}
                        {!cargando && pendientes.length === 0 && (
                            <p style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>No hay tareas pendientes.</p>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {pendientes.map((n) => (
                                <div
                                    key={n.id}
                                    style={{
                                        background: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        padding: '0.75rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>{n.titulo}</span>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                        <button
                                            onClick={() => actualizarEstado(n.id, n.completada)}
                                            style={{
                                                background: '#059669',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.3rem 0.6rem',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Completar
                                        </button>
                                        <button
                                            onClick={() => eliminarNota(n.id)}
                                            style={{
                                                background: '#dc2626',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.3rem 0.6rem',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Columna: Concluidas */}
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1rem', margin: 0, color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Concluidas</span>
                                <span style={{ background: '#14532d', color: '#bbf7d0', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>
                                    {completadas.length}
                                </span>
                            </h2>
                        </div>

                        {!cargando && completadas.length === 0 && (
                            <p style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>Ninguna tarea completada aún.</p>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {completadas.map((n) => (
                                <div
                                    key={n.id}
                                    style={{
                                        background: '#111827',
                                        border: '1px solid #1f2937',
                                        borderRadius: '6px',
                                        padding: '0.75rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        opacity: 0.8
                                    }}
                                >
                                    <span style={{ fontSize: '0.9rem', textDecoration: 'line-through', color: '#64748b', wordBreak: 'break-word' }}>
                                        {n.titulo}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                        <button
                                            onClick={() => actualizarEstado(n.id, n.completada)}
                                            style={{
                                                background: '#374151',
                                                color: '#cbd5e1',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.3rem 0.6rem',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Reabrir
                                        </button>
                                        <button
                                            onClick={() => eliminarNota(n.id)}
                                            style={{
                                                background: '#7f1d1d',
                                                color: '#fca5a5',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.3rem 0.6rem',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TERMINAL DE TELEMETRÍA Y LOGS HTTP */}
                <section style={{
                    background: '#030712',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem 1rem',
                        background: '#0b0f19',
                        borderBottom: '1px solid #1e293b'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.5rem', fontFamily: 'monospace' }}>
                                terminal://http-telemetry-stream
                            </span>
                        </div>
                        <button
                            onClick={() => setLogs([])}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            Limpiar terminal
                        </button>
                    </div>

                    <div style={{ padding: '0.75rem', maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {logs.length === 0 && (
                            <div style={{ color: '#475569', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                Esperando eventos de red... Realiza alguna acción arriba.
                            </div>
                        )}
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                style={{
                                    fontFamily: 'Consolas, Monaco, monospace',
                                    fontSize: '0.78rem',
                                    padding: '0.5rem',
                                    background: '#090d16',
                                    borderRadius: '4px',
                                    borderLeft: `3px solid ${colorMetodo[log.metodo] || '#94a3b8'}`
                                }}
                            >
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>[{log.hora}]</span>
                                    <span style={{
                                        color: '#fff',
                                        background: colorMetodo[log.metodo] || '#334155',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '3px',
                                        fontWeight: 700,
                                        fontSize: '0.7rem'
                                    }}>
                                        {log.metodo}
                                    </span>
                                    <span style={{ color: '#cbd5e1' }}>{log.ruta}</span>
                                    <span style={{ color: log.status < 400 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                                        HTTP {log.status}
                                    </span>
                                    <span style={{ color: '#94a3b8' }}>({log.duracion} ms)</span>
                                </div>
                                <div style={{ marginTop: '0.3rem', color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {JSON.stringify(log.respuesta)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}