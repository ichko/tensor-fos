import { makeStats } from './ui';
import { NodeEditor } from './editor';

import { registerNodeTypes } from './editor/registry';
import { onCtlS, Persistance } from './utils';
import { defaultEditorState } from './default-editor-state';

function manageNodeEditorState(editor: NodeEditor) {
  const EDITOR_STATE_KEY = 'EDITOR_STATE_KEY';
  const persistance = new Persistance();
  const editorState = persistance.get<object>(EDITOR_STATE_KEY);

  if (editorState) {
    console.log('[LOAD] Loading previously saved editor state');
    editor.loadState(editorState);
  } else {
    console.log('[LOAD] Loading default editor state');
    editor.loadState(defaultEditorState);
  }

  editor.resolve();

  onCtlS(() => {
    const editorState = editor.exportState();
    persistance.set(EDITOR_STATE_KEY, editorState);
    console.log('[SAVED] State of nodes saved');
  });
}

window.onload = async () => {
  const stats = makeStats();

  document.body.style.margin = '0px';

  const editor = new NodeEditor();
  document.body.appendChild(editor.domElement);

  registerNodeTypes(editor);
  manageNodeEditorState(editor);

  function loop() {
    stats.begin();
    stats.end();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
};
