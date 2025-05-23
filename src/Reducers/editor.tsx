import {
  SET_CANVAS,
  SET_CANVAS_IMAGE,
  SET_CANVAS_SCALE,
} from "../Actions/actionTypes";
import { Canvas } from "fabric"; // Import kiểu Canvas từ fabric (nếu bạn dùng fabric.js)

// Định nghĩa interface cho state của editorReducer
export interface EditorState {
  canvas: Canvas | null; // Sử dụng kiểu Canvas nếu bạn dùng fabric.js, nếu không thì có thể là HTMLCanvasElement | null
  backgroundColor: string;
  fontSize: string;
  href: string;
  color: string;
  canvasScale: number;
  backgroundImage: string;
}

const initialState: EditorState = {
  canvas: null,
  backgroundColor: "#FDEFEF",
  fontSize: "24",
  href: "",
  color: "#000000",
  canvasScale: 1,
  backgroundImage: "",
};

// Định nghĩa kiểu cho action (có thể cụ thể hơn tùy thuộc vào action creators)
interface SetCanvasAction {
  type: typeof SET_CANVAS;
  data: {
    canvas: Canvas; // Hoặc kiểu canvas bạn đang sử dụng
  };
}

interface SetCanvasImageAction {
  type: typeof SET_CANVAS_IMAGE;
  data: {
    backgroundImage: string;
  };
}

interface SetCanvasScaleAction {
  type: typeof SET_CANVAS_SCALE;
  data: {
    canvasScale: number;
  };
}

type EditorActionTypes = SetCanvasAction | SetCanvasImageAction | SetCanvasScaleAction;

const editorReducer = (state: EditorState = initialState, action: EditorActionTypes): EditorState => {
  // Tạo một bản sao nông của state để tránh mutation trực tiếp
  const localState = { ...state };

  switch (action.type) {
    case SET_CANVAS:
      localState.canvas = action.data.canvas;
      return localState;

    case SET_CANVAS_IMAGE:
      localState.backgroundImage = action.data.backgroundImage;
      return localState;

    case SET_CANVAS_SCALE:
      console.log(action, "xoom");
      localState.canvasScale = action.data.canvasScale;
      return localState;

    default:
      return state;
  }
};

export default editorReducer;