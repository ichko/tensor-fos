import { makeStats } from './ui';
import { NodeEditor } from './node-editor';

import { registerNodeTypes } from './node-registry';
import { onCtlS, Persistance } from './utils';

function manageNodeEditorState(editor: NodeEditor) {
  const EDITOR_STATE_KEY = 'EDITOR_STATE_KEY';
  const persistance = new Persistance();
  const editorState = persistance.get<object>(EDITOR_STATE_KEY);

  if (editorState) {
    console.log('Loading previously saved editor state');
    editor.loadState(editorState);
  } else {
    console.log('No editor state loaded');
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
