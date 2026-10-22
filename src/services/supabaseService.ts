/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Read-Only Supabase Integration Service for STOL Logistics Platform
 * Provides clean modular access to Supabase PostgreSQL read-only REST endpoint.
 * Note: Uses REST endpoint queries with anonymous public keys or user-supplied credentials.
 * Does not expose or require service_role admin keys.
 */

import { Equipment, MaintenanceIncident } from '../types/fleet';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  lastCheckedAt?: string;
  autoSyncEnabled?: boolean;
}

const STORAGE_KEY_SUPABASE = 'stol_supabase_config_v1';

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading Supabase config', e);
  }
  return {
    supabaseUrl: '',
    supabaseAnonKey: '',
    isConnected: false,
    autoSyncEnabled: false,
  };
}

export function saveSupabaseConfig(cfg: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(cfg));
  } catch (e) {
    console.warn('Error saving Supabase config', e);
  }
}

/**
 * Test connectivity to a Supabase project via REST endpoint
 */
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return {
      success: false,
      message: 'Faltan credenciales: Por favor proporcione la URL del proyecto y la anon public key.',
    };
  }

  const startTime = Date.now();
  try {
    // Probe the rest schema endpoint
    const response = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    const latencyMs = Date.now() - startTime;

    if (response.ok || response.status === 200 || response.status === 404) {
      // 200 or OpenAPI schema means endpoint is responsive
      return {
        success: true,
        message: `Conexión exitosa a Supabase REST API (${latencyMs}ms). Modo de lectura activo.`,
        latencyMs,
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'Credencial rechazada (Error 401/403): La anon key es inválida o ha expirado.',
      };
    } else {
      return {
        success: false,
        message: `Respuesta de servidor Supabase: ${response.status} ${response.statusText}`,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Error de red al conectar con Supabase: ${errorMsg}`,
    };
  }
}

/**
 * Read-only fetch for fleet equipments table
 */
export async function fetchSupabaseFleetEquipos(
  url: string,
  anonKey: string
): Promise<{ success: boolean; data?: Equipment[]; error?: string }> {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  try {
    const endpoint = `${cleanUrl}/rest/v1/fleet_equipos?select=*&order=codigo.asc`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const rows = await response.json();
    return { success: true, data: rows };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
