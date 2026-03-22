type Disposable = {
  dispose: jest.Mock<void, []>;
};

type StatusBarItemMock = Disposable & {
  text: string;
  tooltip?: string;
  command?: string;
  show: jest.Mock<void, []>;
  hide: jest.Mock<void, []>;
};

const statusBarItems: StatusBarItemMock[] = [];

function createDisposable(): Disposable {
  return {
    dispose: jest.fn<void, []>()
  };
}

export const StatusBarAlignment = {
  Left: 1,
  Right: 2
} as const;

export const commands = {
  registerCommand: jest.fn((command: string, callback: (...args: unknown[]) => unknown) => {
    return {
      ...createDisposable(),
      command,
      callback
    };
  })
};

export const window = {
  showInformationMessage: jest.fn((_message: string) => Promise.resolve(undefined)),
  createStatusBarItem: jest.fn((_alignment: number, _priority?: number) => {
    const item: StatusBarItemMock = {
      ...createDisposable(),
      text: "",
      tooltip: undefined,
      command: undefined,
      show: jest.fn<void, []>(),
      hide: jest.fn<void, []>()
    };
    statusBarItems.push(item);
    return item;
  })
};

export function __getStatusBarItems(): StatusBarItemMock[] {
  return statusBarItems;
}

export function __resetVscodeMock(): void {
  commands.registerCommand.mockClear();
  window.showInformationMessage.mockClear();
  window.createStatusBarItem.mockClear();
  statusBarItems.splice(0, statusBarItems.length);
}
