define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_AttachMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/Evented'
], function (declare, _WidgetBase, _TemplatedMixin, _AttachMixin, _WidgetsInTemplateMixin, Evented) {
  return declare([_WidgetBase, _TemplatedMixin, _AttachMixin, _WidgetsInTemplateMixin, Evented], {

    templateString: '<div><div data-dojo-attach-point="container"></div><div data-dojo-attach-event="mouseover:mouseOver">Go</div></div>',

    config: {},

    constructor: function (config) {
      lang.mixin(this.config, config);

      this.emit("load", {});
    },

    mouseOver: function () {
      console.log('mouseover');
    }
  });
});