import React, { Component } from 'react';
import * as d3 from 'd3';

// let dy = 162.5;
// let dx = 12;
// let width = 800;
// let tree = d3.tree().nodeSize([dx, dy]);
// let gLink;
// let gNode;
// let root;
// const margin = {top: 10, right: 120, bottom: 10, left: 40};
// let svg;
// let diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);


// Set the dimensions and margins of the diagram
var margin = {
	top: 20,
	right: 90,
	bottom: 30,
	left: 90
};
var width = 1400 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

// Collapse the node and all it's children
function collapse(d) {
	if (d.children) {
		d._children = d.children;
		d._children.forEach(collapse);
		d.children = null;
	}
}

function wrap(text, width) {
	const offset = 15;

	text.each(function() {
		const currOffset = this.getAttribute('text-anchor') === 'end' ? -offset : offset;

		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			y = text.attr("y"),
			tspan = text.text(null).append("tspan").attr("x", currOffset).attr("y", y).attr("dy", 3);

		while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(" "));
				line = [word];
				tspan = text.append("tspan").attr("x", currOffset).attr("y", y).attr("dy", 10).text(word);
			}
		}

		const height = this.getBBox().height;
		console.log(height);
		text.attr("y", -(height/2) + 6);
	});
}

// -------------------------------------------------------------------\

let svg = null, i, duration, root, treemap, path;

const itemWidth = 110;

const update = function (source) {

	// assigns the x and y position for the nodes
	var treeData = treemap(root);

	// Compute the new tree layout.
	var nodes = treeData.descendants(),
		links = treeData.descendants().slice(1);

	// Normalize for fixed-depth.
	nodes.forEach(function(d){ d.y = d.depth * itemWidth});


	// ****************** Nodes section ***************************

	// Update the nodes...
	var node = svg.selectAll('g.node')
		.data(nodes, function(d) {return d.id || (d.id = ++i); });

	// Enter any new modes at the parent's previous position.
	var nodeEnter = node.enter().append('g')
		.attr('class', 'node')
		.attr("transform", function(d) {
			return "translate(" + source.y0 + "," + source.x0 + ")";
		})
		.on('click', click);

	// Add Circle for the nodes
	nodeEnter.append('circle')
		.attr('class', 'node')
		.attr('r', 1e-6)
		.style("fill", function(d) {
			return d._children ? "lightsteelblue" : "#fff";
		});

	// Add labels for the nodes
	nodeEnter.append('text')
		.attr("dy", ".35em")
		.attr("text-anchor", function(d) {
			return d.children || d._children ? "end" : "start";
		})
		.text(function(d) { return d.data.name; })
		.call(wrap, itemWidth - 30);

	// UPDATE
	var nodeUpdate = nodeEnter.merge(node);

	// Transition to the proper position for the node
	nodeUpdate.transition()
		.duration(duration)
		.attr("transform", function(d) {
			return "translate(" + d.y + "," + d.x + ")";
		});

	// Update the node attributes and style
	nodeUpdate.select('circle.node')
		.attr('r', 10)
		.style("fill", function(d) {
			return d._children ? "lightsteelblue" : "#fff";
		})
		.attr('cursor', 'pointer');


	// Remove any exiting nodes
	var nodeExit = node.exit().transition()
		.duration(duration)
		.attr("transform", function(d) {
			return "translate(" + source.y + "," + source.x + ")";
		})
		.remove();

	// On exit reduce the node circles size to 0
	nodeExit.select('circle')
		.attr('r', 1e-6);

	// On exit reduce the opacity of text labels
	nodeExit.select('text')
		.style('fill-opacity', 1e-6);


	// ****************** links section ***************************

	// Update the links...
	var link = svg.selectAll('path.link')
		.data(links, function(d) { return d.id; });

	// Enter any new links at the parent's previous position.
	var linkEnter = link.enter().insert('path', "g")
		.attr("class", "link")
		.attr('d', function(d){
			var o = {x: source.x0, y: source.y0}
			return diagonal(o, o)
		});

	// UPDATE
	var linkUpdate = linkEnter.merge(link);

	// Transition back to the parent element position
	linkUpdate.transition()
		.duration(duration)
		.attr('d', function(d){ return diagonal(d, d.parent) });

	// Remove any exiting links
	var linkExit = link.exit().transition()
		.duration(duration)
		.attr('d', function(d) {
			var o = {x: source.x, y: source.y}
			return diagonal(o, o)
		})
		.remove();

	// Store the old positions for transition.
	nodes.forEach(function(d){
		d.x0 = d.x;
		d.y0 = d.y;
	});

	// Creates a curved (diagonal) path from parent to the child nodes
	function diagonal(s, d) {
		path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;

		return path;
	}

	// toggle children on click
	function click(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		update(d);
	}
};


class ComparisonGraph extends Component {
	componentDidMount () {
		this.drawChart();
	}

	componentDidUpdate() {
		this.drawChart();
	}

	shouldComponentUpdate (nextProps, nextState, nextContext) {
		return this.props.numItems !== nextProps.numItems;
	}

	drawChart() {
		const data = this.props.data;

		if (data === null) {
			return;
		}

		if (svg === null) {
			svg = d3.select("#vis")
				.attr("width", width + margin.right + margin.left)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			i = 0;
			duration = 500;

			// declares a tree layout and assigns the size
			treemap = d3.tree().size([height, width]);
		}

		// assigns parent, children, height, depth
		root = d3.hierarchy(data, function(d) { return d.children; });
		root.x0 = height / 2;
		root.y0 = 0;

		// collapse after the second level
		//root.children.forEach(collapse);

		update(root);
	}

	render() {
		return (
			<svg id="vis">
				<defs>
					<filter x="0" y="0" width="1" height="1" id="solid">
						<feFlood floodColor="white" />
						<feComposite in="SourceGraphic" operator="xor" />
					</filter>
				</defs>
			</svg>
		);
	}
}

export default ComparisonGraph;

