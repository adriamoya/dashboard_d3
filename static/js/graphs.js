
queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraphs(error, recordsJson) {

    
    //Clean data
    var spendData       = recordsJson;

    var parseDate       = d3.time.format("%Y-%m-%d");
    var numFormat       = d3.format('.2f');
    var commax          = d3.format(",.0f");

    var segmRingChart   = dc.pieChart("#chart-ring-segm"),
        riskHistChart   = dc.barChart("#chart-hist-risk"),
        hipRingChart    = dc.pieChart("#chart-ring-hip"),
        tipRowChart     = dc.rowChart("#chart-row-tip"),
        DTRowChart      = dc.rowChart("#chart-row-DT");

    // normalize/parse data
    spendData.forEach(function(d){
        d.Date          = parseDate.parse(d["Date"]);
        d.TipDot        = d["TipDot"];
        d.Segment       = d["Segment"];
        d.Hip           = d["Hipotecario"];
        d.DT            = d["DT"];
        d.Risk          = +d["Risk"];
    });

    // set crossfilter
    var ndx = crossfilter(spendData),
        dateDim         = ndx.dimension(function(d) {return d.Date; }),
        riskDim         = ndx.dimension(function(d) {return Math.floor(d.Risk/10); }),
        tipDotDim       = ndx.dimension(function(d) {return d.TipDot;} ),
        segmentDim      = ndx.dimension(function(d) {return d.Segment; }),
        hipDim          = ndx.dimension(function(d) {return d.Hip; }),
        DTDim           = ndx.dimension(function(d) {return d.DT; }),
        riskPerMonth    = dateDim.group().reduceSum(function(d) {return +d.Risk; }),
        riskPerTipDot   = tipDotDim.group().reduceSum(function(d) {return +d.Risk; }),
        riskPerSegment  = segmentDim.group().reduceSum(function(d) {return +d.Risk; }),
        riskPerHip      = hipDim.group().reduceSum(function(d) {return +d.Risk; }),
        riskPerDT       = DTDim.group().reduceSum(function(d) {return +d.Risk; }),
        riskHist        = riskDim.group().reduceSum(function(d) {return +d.Risk; });

    // define group all for counting
    var all             = ndx.groupAll(),
        riskAll         = all.reduceSum(function(d)  {return +d.Risk; });
        
    var minDate         = dateDim.bottom(1)[0].Date;
    var maxDate         = dateDim.top(1)[0].Date;
    var maxRisk         = 1.2*riskPerMonth.top(1)[0].value;

    // nonEmptyHist = remove_empty_bins(riskHistChart);

    segmRingChart
        .dimension(segmentDim)
        .group(riskPerSegment)
        .innerRadius(35)
        .controlsUseVisibility(true)
        // .legend(dc.legend())
        .label(function(d) {
            return d.key + ": " + commax(d.value);
            // return d.key + ": " + commax(d.value) + " (" + Math.floor(d.value / riskAll.value() * 100) + "%)";
            // return commax(d.value) + " (" + Math.floor(d.value / riskAll.value() * 100) + "%)";
        })
        .externalRadiusPadding(15);

    hipRingChart
        .dimension(hipDim)
        .group(riskPerHip)
        .controlsUseVisibility(true)
        .innerRadius(35)
        .controlsUseVisibility(true)
        .legend(dc.legend())
        .label(function(d) {
            // return d.key + ": " + commax(d.value);
            // return d.key + ": " + commax(d.value) + " (" + Math.floor(d.value / riskAll.value() * 100) + "%)";
            return commax(d.value) + " (" + Math.floor(d.value / riskAll.value() * 100) + "%)";
        })
        .externalRadiusPadding(15);;

    riskHistChart
        .dimension(dateDim)
        .group(riskPerMonth)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .round(d3.time.month.round)
        .clipPadding(50)
      	.xUnits(d3.time.months)
      	.centerBar(true)    
        // .gap(2) //set the gap
        .barPadding(0.3)
        .xAxisPadding(30)
        // .yAxisLabel('Riesgo dispuesto (M€)')
        .elasticY(true)
        .colors("#3182bd")
        // .yAxisPadding(30)
        .controlsUseVisibility(true)
        .margins({left: 60, top: 25, right: 40, bottom: 40})
        // .renderLabel(true);
        .renderlet(function(chart){

            var barsData = [];
            var bars = chart.selectAll('.bar').each(function(d) { barsData.push(d); });

            //Remove old values (if found)
            d3.select(bars[0][0].parentNode).select('#inline-labels').remove();
            //Create group for labels 
            var gLabels = d3.select(bars[0][0].parentNode).append('g').attr('id','inline-labels');

            for (var i = bars[0].length - 1; i >= 0; i--) {

                var b = bars[0][i];
                //Only create label if bar height is tall enough
                if (+b.getAttribute('height') < 1) continue;

                gLabels
                    .append("text")
                    .text(commax(barsData[i].data.value))
                    .attr('x', +b.getAttribute('x') + (b.getAttribute('width')/2) )
                    .attr('y', +b.getAttribute('y') - 8)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'black')
                    .attr('font-size','11px')
                    .attr('font','arial');
            }

        })

    riskHistChart.yAxis().tickFormat(function (v) {return v/1000 + "mM€";});


    tipRowChart
        .dimension(tipDotDim)
        .group(riskPerTipDot)
        .margins({left: 5, top: 5, right: 5, bottom: 40})
        .elasticX(true)
        .controlsUseVisibility(true)
        .ordering(function(d){ return -d.value })
        .renderTitleLabel(false)
        // .titleLabelOffsetX(50)
        .label(function (d){
           return d.key + ": " + commax(d.value) + " (" + Math.floor(d.value / riskAll.value() * 100) + "%)";
           // return d.key + ": " + commax(d.value);
        })
        .renderLabel(true);

    tipRowChart.xAxis().tickFormat(function(v) {return v/1000 + "mM€";});


    DTRowChart
        .dimension(DTDim)
        .group(riskPerDT)
        .margins({left: 5, top: 5, right: 5, bottom: 40})
        .elasticX(true)
        .controlsUseVisibility(true)
        .renderTitleLabel(false)
        .ordering(function(d){ return -d.value })
        // .ordering(function(d) {
        //     if(d.value == "Resto") return 0;
        //     else if(d.key == "Tuesday") return 1;
        //     // handle all days 
        // })

        // .titleLabelOffsetX(50)
        .label(function (d){
           // return d.key + ": " + commax(d.value);
           return d.key + ": " + commax(d.value) + " (" + Math.floor(d.value / riskAll.value() * 100) + "%)";
        })
        .renderLabel(true);

    DTRowChart.xAxis().tickFormat(function(v) {return v/1000 + "mM€";});

      function show_empty_message(chart) {
          var is_empty = d3.sum(chart.group().all().map(chart.valueAccessor())) === 0;
          var data = is_empty ? [1] : [];
          var empty = chart.svg().selectAll('.empty-message').data(data);
          empty.enter().append('text')
              .text('NO DATA!')
              .attr({
                  'text-anchor': 'middle',
                  'alignment-baseline': 'middle',
                  class: 'empty-message',
                  x: chart.margins().left + chart.effectiveWidth()/2,
                  y: chart.margins().top + chart.effectiveHeight()/2
              })
              .style('opacity', 0);
          empty.transition().duration(1000).style('opacity', 1);
          empty.exit().remove();
      }
      // segmRingChart.on('pretransition', show_empty_message);
      riskHistChart.on('pretransition', show_empty_message);
      tipRowChart.on('pretransition', show_empty_message);
      DTRowChart.on('pretransition', show_empty_message);

    dc.renderAll();


    // Customization

    // Add x-axis label in row-chart
    function AddXAxis(chartToUpdate, displayText)
    {
        chartToUpdate.svg()
                    .append("text")
                    .attr("class", "x-axis-label")
                    .attr("text-anchor", "middle")
                    .attr("x", chartToUpdate.width()/2)
                    .attr("y", chartToUpdate.height()-1)
                    .attr("font-size","11px")
                    .text(displayText);
    }
    // AddXAxis(tipRowChart, 'Riesgo dispuesto (M€)');
    // AddXAxis(DTRowChart, 'Riesgo dispuesto (M€)');

    // Adjust to the left the position of the labels in row-chart
    // d3.selectAll("#chart-row-tip > svg > g > g.row > text").attr('x','10');
    d3.selectAll("#chart-row-DT > svg > g > g.row > text").attr('x','10');
    tipRowChart.render();
};
