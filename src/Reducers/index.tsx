import { combineReducers, Reducer } from 'redux';
import Editor, { EditorState } from './editor'; // Giả sử Editor component có một interface hoặc type EditorState

// Định nghĩa kiểu cho state của reducer 'editor'
export interface RootState {
  editor: EditorState;
}

const reducer: Reducer<RootState> = combineReducers({
  editor: Editor as Reducer<EditorState, any> // Ép kiểu Editor nếu nó là một reducer hoặc component trả về state
});

export default reducer;