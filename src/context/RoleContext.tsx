import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'DIRECTORIO' | 'OPERACIONES';

export interface BoardDecisionAgreement {
  id: string;
  observationId: string;
  title: string;
  agreementText: string;
  decisionDate: string;
  approvedBy: string;
  priority: 'ALTA' | 'MEDIA' | 'ESTRATEGICA';
  deadline: string;
  status: 'PENDIENTE_EJECUCION' | 'EN_CURSO' | 'CUMPLIDO';
}

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  boardAgreements: BoardDecisionAgreement[];
  addBoardAgreement: (agreement: Omit<BoardDecisionAgreement, 'id' | 'decisionDate'>) => void;
  updateAgreementStatus: (id: string, status: BoardDecisionAgreement['status']) => void;
  lastOperationFeed: string;
  setLastOperationFeed: (feed: string) => void;
  activeFeedersCount: number;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const INITIAL_BOARD_AGREEMENTS: BoardDecisionAgreement[] = [
  {
    id: 'agr-1',
    observationId: 'obs-over-1',
    title: 'Tope de Horas Extras Dominicales Almacén Central',
    agreementText:
      'Directorio aprueba fijar un tope estricto de 12 horas dominicales por operario/mes y renegociar el cuarto turno rotativo 4x3 para inicio en semana 43.',
    decisionDate: '19 Oct 2026',
    approvedBy: 'Sesión de Directorio STOL',
    priority: 'ALTA',
    deadline: '31 Oct 2026',
    status: 'EN_CURSO',
  },
  {
    id: 'agr-2',
    observationId: 'obs-over-2',
    title: 'Refacturación Retroactiva por Desvío Volumétrico (+45.7%)',
    agreementText:
      'Directorio instruye a Gerencia Comercial emitir nota de débito y adenda tarifaria por ocupación real de SKU-ALM-8820 (0.152 m³ vs 0.104 m³ WMS).',
    decisionDate: '19 Oct 2026',
    approvedBy: 'Sesión de Directorio STOL',
    priority: 'ESTRATEGICA',
    deadline: '15 Nov 2026',
    status: 'PENDIENTE_EJECUCION',
  },
  {
    id: 'agr-3',
    observationId: 'obs-over-3',
    title: 'Aplicación de Penalidad a DERCO por Retraso de SLA',
    agreementText:
      'Directorio instruye retener el 15% de la facturación mensual del proveedor DERCO hasta subsanar el tiempo de parada de 24.5h en montacargas KGR-241.',
    decisionDate: '19 Oct 2026',
    approvedBy: 'Sesión de Directorio STOL',
    priority: 'ALTA',
    deadline: '28 Oct 2026',
    status: 'EN_CURSO',
  },
];

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('DIRECTORIO');
  const [lastOperationFeed, setLastOperationFeed] = useState<string>('Hoy, 12:45 (Sede Huachipa / Almacén Central)');
  const [boardAgreements, setBoardAgreements] = useState<BoardDecisionAgreement[]>(INITIAL_BOARD_AGREEMENTS);

  const toggleRole = () => {
    setRole((prev) => (prev === 'DIRECTORIO' ? 'OPERACIONES' : 'DIRECTORIO'));
  };

  const addBoardAgreement = (agreement: Omit<BoardDecisionAgreement, 'id' | 'decisionDate'>) => {
    const newAgr: BoardDecisionAgreement = {
      ...agreement,
      id: `agr-${Date.now()}`,
      decisionDate: new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
    setBoardAgreements([newAgr, ...boardAgreements]);
  };

  const updateAgreementStatus = (id: string, status: BoardDecisionAgreement['status']) => {
    setBoardAgreements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        boardAgreements,
        addBoardAgreement,
        updateAgreementStatus,
        lastOperationFeed,
        setLastOperationFeed,
        activeFeedersCount: 6,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
