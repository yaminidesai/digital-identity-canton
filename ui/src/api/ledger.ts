import { API_BASE, PACKAGE_NAME } from '../config';

function templateId(module: string, entity: string): string {
  return `#${PACKAGE_NAME}:${module}:${entity}`;
}

export { templateId };

let commandCounter = 0;
function nextCommandId(): string {
  return `cmd-${Date.now()}-${++commandCounter}`;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export interface CreateResult {
  completionOffset: string;
  transaction?: {
    events: Array<{
      CreatedEvent?: {
        contractId: string;
        templateId: string;
        createArguments: Record<string, unknown>;
      };
    }>;
  };
}

export async function submitCreate(
  userId: string,
  actAs: string[],
  module: string,
  entity: string,
  args: Record<string, unknown>,
): Promise<CreateResult> {
  return apiPost('/commands/submit-and-wait', {
    commands: [
      {
        CreateCommand: {
          templateId: templateId(module, entity),
          createArguments: args,
        },
      },
    ],
    userId,
    commandId: nextCommandId(),
    actAs,
  });
}

export async function submitExercise(
  userId: string,
  actAs: string[],
  module: string,
  entity: string,
  contractId: string,
  choice: string,
  choiceArgument: Record<string, unknown> = {},
): Promise<CreateResult> {
  return apiPost('/commands/submit-and-wait', {
    commands: [
      {
        ExerciseCommand: {
          templateId: templateId(module, entity),
          contractId,
          choice,
          choiceArgument,
        },
      },
    ],
    userId,
    commandId: nextCommandId(),
    actAs,
  });
}

export interface ActiveContract {
  contractId: string;
  templateId: string;
  createArguments: Record<string, unknown>;
}

export interface ActiveContractsResponse {
  offset: string;
  contractEntries: Array<{
    activeContract?: {
      createdEvent: {
        contractId: string;
        templateId: string;
        createArguments: Record<string, unknown>;
      };
    };
    incompleteUnassigned?: unknown;
    incompleteAssigned?: unknown;
  }>;
}

export async function queryActiveContracts(
  parties: string[],
  templateFilter?: { module: string; entity: string },
): Promise<ActiveContract[]> {
  const offsetRes = await getLedgerEnd();
  const offset = offsetRes.offset;

  let filter: Record<string, unknown>;

  if (templateFilter) {
    const tid = templateId(templateFilter.module, templateFilter.entity);
    const filtersByParty: Record<string, unknown> = {};
    for (const p of parties) {
      filtersByParty[p] = {
        cumulative: [
          {
            identifierFilter: {
              TemplateFilter: {
                value: {
                  templateId: tid,
                  includeCreatedEventBlob: false,
                },
              },
            },
          },
        ],
      };
    }
    filter = { filtersByParty, filtersForAnyParty: {} };
  } else {
    filter = {
      filtersByParty: {},
      filtersForAnyParty: {
        cumulative: [
          {
            identifierFilter: {
              WildcardFilter: {
                value: { includeCreatedEventBlob: false },
              },
            },
          },
        ],
      },
    };
  }

  const res = await apiPost<ActiveContractsResponse>('/state/active-contracts', {
    filter,
    verbose: true,
    activeAtOffset: offset,
  });

  return (res.contractEntries || [])
    .filter((e) => e.activeContract)
    .map((e) => ({
      contractId: e.activeContract!.createdEvent.contractId,
      templateId: e.activeContract!.createdEvent.templateId,
      createArguments: e.activeContract!.createdEvent.createArguments,
    }));
}

export async function getLedgerEnd(): Promise<{ offset: string }> {
  return apiGet('/state/ledger-end');
}
