/**
 * @module ol/renderer/canvas/Layer
 */
import {abstract} from '../../util.js';
import {getBottomLeft, getBottomRight, getTopLeft, getTopRight} from '../../extent.js';
import {TRUE} from '../../functions.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import {rotateAtOffset} from '../../render/canvas.js';
import CanvasImmediateRenderer from '../../render/canvas/Immediate.js';
import LayerRenderer from '../Layer.js';
import {create as createTransform, apply as applyTransform, compose as composeTransform} from '../../transform.js';

/**
 * @abstract
 */
class CanvasLayerRenderer extends LayerRenderer {

  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   */
  constructor(layer) {

    super(layer);

    /**
     * @protected
     * @type {number}
     */
    this.renderedResolution;

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.transform_ = createTransform();

  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent Clip extent.
   * @protected
   */
  clip(context, frameState, extent) {
    const pixelRatio = frameState.pixelRatio;
    const halfWidth = (frameState.size[0] * pixelRatio) / 2;
    const halfHeight = (frameState.size[1] * pixelRatio) / 2;
    const rotation = frameState.viewState.rotation;
    const topLeft = getTopLeft(extent);
    const topRight = getTopRight(extent);
    const bottomRight = getBottomRight(extent);
    const bottomLeft = getBottomLeft(extent);

    applyTransform(frameState.coordinateToPixelTransform, topLeft);
    applyTransform(frameState.coordinateToPixelTransform, topRight);
    applyTransform(frameState.coordinateToPixelTransform, bottomRight);
    applyTransform(frameState.coordinateToPixelTransform, bottomLeft);

    context.save();
    rotateAtOffset(context, -rotation, halfWidth, halfHeight);
    context.beginPath();
    context.moveTo(topLeft[0] * pixelRatio, topLeft[1] * pixelRatio);
    context.lineTo(topRight[0] * pixelRatio, topRight[1] * pixelRatio);
    context.lineTo(bottomRight[0] * pixelRatio, bottomRight[1] * pixelRatio);
    context.lineTo(bottomLeft[0] * pixelRatio, bottomLeft[1] * pixelRatio);
    context.clip();
    rotateAtOffset(context, rotation, halfWidth, halfHeight);
  }

  /**
   * @param {import("../../render/EventType.js").default} type Event type.
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @private
   */
  dispatchComposeEvent_(type, context, frameState, opt_transform) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      const halfWidth = (frameState.size[0] * frameState.pixelRatio) / 2;
      const halfHeight = (frameState.size[1] * frameState.pixelRatio) / 2;
      const rotation = frameState.viewState.rotation;
      rotateAtOffset(context, -rotation, halfWidth, halfHeight);
      const transform = opt_transform !== undefined ?
        opt_transform : this.getTransform(frameState, 0);
      const render = new CanvasImmediateRenderer(
        context, frameState.pixelRatio, frameState.extent, transform,
        frameState.viewState.rotation);
      const composeEvent = new RenderEvent(type, render, frameState,
        context, null);
      layer.dispatchEvent(composeEvent);
      rotateAtOffset(context, rotation, halfWidth, halfHeight);
    }
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../PluggableMap.js").FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {function(this: S, import("../../layer/Layer.js").default, (Uint8ClampedArray|Uint8Array)): T} callback Layer
   *     callback.
   * @param {S} thisArg Value to use as `this` when executing `callback`.
   * @return {T|undefined} Callback result.
   * @template S,T,U
   */
  forEachLayerAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg) {
    const hasFeature = this.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, TRUE);

    if (hasFeature) {
      return callback.call(thisArg, this.getLayer(), null);
    } else {
      return undefined;
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../layer/Layer.js").State} layerState Layer state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @protected
   */
  postCompose(context, frameState, layerState, opt_transform) {
    this.dispatchComposeEvent_(RenderEventType.POSTCOMPOSE, context, frameState, opt_transform);
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @protected
   */
  preCompose(context, frameState, opt_transform) {
    this.dispatchComposeEvent_(RenderEventType.PRECOMPOSE, context, frameState, opt_transform);
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @protected
   */
  preRender(frameState, opt_transform) {
    // TODO: pre-render event
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../layer/Layer.js").State} layerState Layer state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @protected
   */
  postRender(frameState, layerState, opt_transform) {
    // TODO: pre-render event
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @protected
   */
  dispatchRenderEvent(context, frameState, opt_transform) {
    this.dispatchComposeEvent_(RenderEventType.RENDER, context, frameState, opt_transform);
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {number} offsetX Offset on the x-axis in view coordinates.
   * @protected
   * @return {!import("../../transform.js").Transform} Transform.
   */
  getTransform(frameState, offsetX) {
    const viewState = frameState.viewState;
    const pixelRatio = frameState.pixelRatio;
    const dx1 = pixelRatio * frameState.size[0] / 2;
    const dy1 = pixelRatio * frameState.size[1] / 2;
    const sx = pixelRatio / viewState.resolution;
    const sy = -sx;
    const angle = -viewState.rotation;
    const dx2 = -viewState.center[0] + offsetX;
    const dy2 = -viewState.center[1];
    return composeTransform(this.transform_, dx1, dy1, sx, sy, angle, dx2, dy2);
  }

  /**
   * Creates a transform for rendering to an element that will be rotated after rendering.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {number} width Width of the rendered element (in pixels).
   * @param {number} height Height of the rendered element (in pixels).
   * @param {number} offsetX Offset on the x-axis in view coordinates.
   * @protected
   * @return {!import("../../transform.js").Transform} Transform.
   */
  getRenderTransform(frameState, width, height, offsetX) {
    const viewState = frameState.viewState;
    const pixelRatio = frameState.pixelRatio;
    const dx1 = width / 2;
    const dy1 = height / 2;
    const sx = pixelRatio / viewState.resolution;
    const sy = -sx;
    const dx2 = -viewState.center[0] + offsetX;
    const dy2 = -viewState.center[1];
    return composeTransform(this.transform_, dx1, dy1, sx, sy, 0, dx2, dy2);
  }

  /**
   * @abstract
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../layer/Layer.js").State} layerState Layer state.
   * @param {CanvasRenderingContext2D} context Context.
   */
  composeFrame(frameState, layerState, context) {
    abstract();
  }

}

export default CanvasLayerRenderer;
