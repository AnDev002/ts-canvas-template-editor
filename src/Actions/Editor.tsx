import {
  SET_CANVAS,
  SET_CANVAS_IMAGE,
  SET_CANVAS_SCALE,
} from "./actionTypes";
import { Canvas } from 'fabric';


interface SetCanvasAction {
  type: typeof SET_CANVAS;
  data: {
    canvas: Canvas; 
  };
}

interface SetCanvasBackgroundImageAction {
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

export const setCanvas = (data: { canvas: Canvas }): SetCanvasAction => {
  return {
    type: SET_CANVAS,
    data,
  };
};

export const setCanvasBackgroundImage = (data: { backgroundImage: string }): SetCanvasBackgroundImageAction => {
  return {
    type: SET_CANVAS_IMAGE,
    data,
  };
};

export const setCanvasScale = (data: { canvasScale: number }): SetCanvasScaleAction => {
  return {
    type: SET_CANVAS_SCALE, 
    data,
  };
};