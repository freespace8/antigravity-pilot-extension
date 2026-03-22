import type { CdpConnection } from "../../types/cdp";

export type CloseTabsResult =
  | {
      ok: true;
      closed: number;
    }
  | {
      ok: false;
      reason: string;
    };

const CLOSE_TABS_SCRIPT = `(() => {
  let closed = 0;
  const closeButtons = document.querySelectorAll(
    '.tabs-container .tab-close .codicon-close, ' +
    '.tabs-container .tab-actions .action-label, ' +
    '.tab .monaco-icon-label-container + .tab-actions .codicon'
  );

  closeButtons.forEach((button) => {
    try {
      button.click();
      closed++;
    } catch {}
  });

  if (closed === 0) {
    const tabs = document.querySelectorAll('.tabs-container .tab');
    tabs.forEach((tab) => {
      const closeButton = tab.querySelector('.codicon-close') || tab.querySelector('[title*="Close"]');
      if (closeButton) {
        try {
          closeButton.click();
          closed++;
        } catch {}
      }
    });
  }

  return { closed };
})()`;

/**
 * Close open editor tabs inside the workbench DOM of the active window.
 */
export async function closeTabs(connection: CdpConnection): Promise<CloseTabsResult> {
  try {
    const result = await connection.call<{ result?: { value?: { closed?: number } } }>("Runtime.evaluate", {
      expression: CLOSE_TABS_SCRIPT,
      returnByValue: true,
      ...(typeof connection.rootContextId === "number" ? { contextId: connection.rootContextId } : {})
    });

    return {
      ok: true,
      closed: result.result?.value?.closed ?? 0
    };
  } catch (error) {
    return {
      ok: false,
      reason: (error as Error).message
    };
  }
}
