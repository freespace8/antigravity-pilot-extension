import type { CdpConnection } from "../../types/cdp";
import { SIMPLIFY_MODE_ATTRIBUTE, SIMPLIFY_STYLE_ID, type SimplifyMode } from "../../state/types";

type SimplifyActionResult =
  | {
      ok: true;
      mode: SimplifyMode;
      appliedContexts: number[];
    }
  | {
      ok: false;
      mode: SimplifyMode;
      reason: string;
    };

const SIMPLIFY_CSS_FULL = `
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
}
.part.editor,
.editor-group-container,
.part.sidebar,
.part.panel {
  content-visibility: hidden !important;
  height: 0 !important;
  overflow: hidden !important;
}
.part.statusbar,
.activitybar {
  display: none !important;
}
.part.titlebar {
  max-height: 28px !important;
  overflow: hidden !important;
}
* {
  will-change: auto !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
.part.editor canvas,
.part.sidebar canvas,
.part.panel canvas {
  display: none !important;
}
.part.auxiliarybar {
  contain: layout style paint !important;
}
`;

const SIMPLIFY_CSS_LIGHT = `
*, *::before, *::after {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
.minimap,
.minimap-shadow-visible,
.breadcrumbs-below-tabs {
  display: none !important;
}
.part.panel {
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
}
* {
  will-change: auto !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
.cursor {
  animation: none !important;
  opacity: 1 !important;
}
`;

function buildSimplifyScript(mode: SimplifyMode): string {
  if (mode === "off") {
    return `(() => {
      const style = document.getElementById(${JSON.stringify(SIMPLIFY_STYLE_ID)});
      if (style) {
        style.remove();
      }
      document.documentElement.removeAttribute(${JSON.stringify(SIMPLIFY_MODE_ATTRIBUTE)});
      return { ok: true, mode: "off" };
    })()`;
  }

  const css = mode === "full" ? SIMPLIFY_CSS_FULL : SIMPLIFY_CSS_LIGHT;
  return `(() => {
    const styleId = ${JSON.stringify(SIMPLIFY_STYLE_ID)};
    const modeAttribute = ${JSON.stringify(SIMPLIFY_MODE_ATTRIBUTE)};
    const existing = document.getElementById(styleId);
    if (existing) {
      existing.remove();
    }
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = ${JSON.stringify(css)};
    (document.head || document.documentElement).appendChild(style);
    document.documentElement.setAttribute(modeAttribute, ${JSON.stringify(mode)});
    return { ok: true, mode: ${JSON.stringify(mode)} };
  })()`;
}

function getContextIds(connection: CdpConnection): Array<number | undefined> {
  if (connection.contexts.length === 0) {
    return [connection.rootContextId];
  }

  return connection.contexts.map((context) => context.id);
}

/**
 * Apply or remove the simplify marker and CSS across every known execution context.
 */
export async function setSimplifyMode(
  connection: CdpConnection,
  mode: SimplifyMode
): Promise<SimplifyActionResult> {
  const expression = buildSimplifyScript(mode);
  const appliedContexts: number[] = [];

  for (const contextId of getContextIds(connection)) {
    try {
      const result = await connection.call<{ result?: { value?: { ok?: boolean } } }>("Runtime.evaluate", {
        expression,
        returnByValue: true,
        ...(typeof contextId === "number" ? { contextId } : {})
      });

      if (result.result?.value?.ok) {
        appliedContexts.push(typeof contextId === "number" ? contextId : -1);
      }
    } catch {
      continue;
    }
  }

  if (appliedContexts.length === 0) {
    return {
      ok: false,
      mode,
      reason: "failed to apply simplify mode in any execution context"
    };
  }

  return {
    ok: true,
    mode,
    appliedContexts
  };
}
