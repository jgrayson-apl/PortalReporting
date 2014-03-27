define([
  "dojo/ready",
  "dojo/_base/declare",
  "dojo/Evented",
  "dojo/_base/lang",
  "dojo/_base/array"
], function (ready, declare, Evented, lang, array) {
  return declare([Evented], {

    config: {
      radius: 74,
      pieWidth: 30,
      padding: 10,
      infos: {
        "bw": {color: "gray", label: "Bandwidth"},
        "credits": { color: "darkred", label: "Credits"},
        "num": { color: "darkblue", label: "Number of Request"},
        "stg": { color: "darkgreen", label: "Staging"}
      }
    },

    constructor: function (config) {
      lang.mixin(this.config, config);

      this.color = d3.scale.ordinal().range(array.map(this.config.infos, lang.hitch(this, function (info) {
        return info.color;
      })));

      this.arc = d3.svg.arc()
          .outerRadius(this.config.radius)
          .innerRadius(this.config.radius - this.config.pieWidth);

      this.pie = d3.layout.pie()
          .sort(null)
          .value(function (d) {
            return d.value;
          });

      ready(lang.hitch(this, function () {
        this.emit("load", {});
      }));
    },

    calcTotal: function (values) {
      var totalValue = 0;
      array.forEach(values, lang.hitch(this, function (val) {
        totalValue += parseFloat(val[1]);
      }));
      return totalValue;
    },

    displayUserStatsAsPieCharts: function (userCreditsData, targetNodeId) {
      //console.log(userCreditsData);

      this.color.domain(d3.keys(userCreditsData[0]).filter(lang.hitch(this, function (key) {
        return (this.config.infos[key] != null);
        //return (array.indexOf(["bw", "credits", "num", "stg"], key) > -1);
      })));

      array.forEach(userCreditsData, lang.hitch(this, function (userCreditData) {
        userCreditData.stats = this.color.domain().map(lang.hitch(this, function (name) {
          return {name: name, value: this.calcTotal(userCreditData[name])};
        }));
      }));

      this.legend = d3.select("#" + targetNodeId).append("svg")
          .attr("class", "legend")
          .attr("width", this.config.radius * 2)
          .attr("height", this.config.radius * 2)
          .selectAll("g")
          .data(this.color.domain())
          .enter().append("g")
          .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
          });

      this.legend.append("rect")
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", this.color);

      this.legend.append("text")
          .attr("x", 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .text(lang.hitch(this, function (d) {
            return this.config.infos[d].label;
          }));

      this.svg = d3.select("#" + targetNodeId).selectAll(".pie")
          .data(userCreditsData)
          .enter().append("svg")
          .attr("class", "pie")
          .attr("width", this.config.radius * 2)
          .attr("height", this.config.radius * 2)
          .append("g")
          .attr("transform", "translate(" + this.config.radius + "," + this.config.radius + ")");

      this.svg.selectAll(".arc")
          .data(lang.hitch(this, function (d) {
            return this.pie(d.stats);
          }))
          .enter().append("path")
          .attr("class", "arc")
          .attr("d", this.arc)
          .style("fill", lang.hitch(this, function (d) {
            return this.color(d.data.name);
          }));

      this.svg.append("text")
          .attr("dy", ".35em")
          .style("text-anchor", "middle")
          .text(function (d) {
            return d.username;
          });

    }

  });
});
  

