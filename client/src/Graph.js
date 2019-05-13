import React, { Component } from 'react';
import * as d3 from 'd3';

let dy = 162.5;
let dx = 12;
let width = 800;
let tree = d3.tree().nodeSize([dx, dy]);
let gLink;
let gNode;
let root;
const margin = {top: 10, right: 120, bottom: 10, left: 40};
let svg;
let diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);


class Graph extends Component {
	componentDidMount () {
		this.drawChart();
	}

	componentDidUpdate() {
		this.drawChart();
	}

	drawChart() {
		const data = this.props.kingdoms;
		root = d3.hierarchy(data);

		root.x0 = dy / 2;
		root.y0 = 0;
		root.descendants().forEach((d, i) => {
			d.id = i;
			d._children = d.children;
			if (d.depth && d.data.name.length !== 7) d.children = null;
		});

		svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", dx)
			.attr("viewBox", [-margin.left, -margin.top, width, dx])
			.style("font", "10px sans-serif")
			.style("user-select", "none");

		gLink = svg.append("g")
			.attr("fill", "none")
			.attr("stroke", '#555555')
			// .attr("stroke", (d) => {
			// 	console.log(d);
			// 	return '#cccccc';
			// })
			.attr("stroke-opacity", 0.4)
			.attr("stroke-width", 1.5);

		gNode = svg.append("g")
			.attr("cursor", "pointer")
			.attr("pointer-events", "all");

		this.update(root);
	}

	update(source) {
		const duration = d3.event && d3.event.altKey ? 2500 : 250;
		const nodes = root.descendants().reverse();
		const links = root.links();

		tree(root); // compute the new tree layout

		let left = root;
		let right = root;
		root.eachBefore(node => {
			if (node.x < left.x) left = node;
			if (node.x > right.x) right = node;
		});

		const height = right.x - left.x + margin.top + margin.bottom;

		const transition = svg.transition()
			.duration(duration)
			.attr("height", height)
			.attr("viewBox", [-margin.left, left.x - margin.top, width, height])
			.tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

		// Update the nodes…
		const node = gNode.selectAll("g")
			.data(nodes, d => d.id);

		// Enter any new nodes at the parent's previous position
		const nodeEnter = node.enter().append("g")
			.attr("transform", d => `translate(${source.y0},${source.x0})`)
			.attr("fill-opacity", 0)
			.attr("stroke-opacity", 0)
			.on("click", d => {
				d.children = d.children ? null : d._children;
				this.update(d);
			});

		nodeEnter.append("circle")
			.attr("r", 2.5)
			.attr("fill", (d) => {
				if (d.data.numObservations > 0) {
					return d._children ? "#4286f4" : "#6ba1f9";
				}
				return d._children ? "#555555" : "#cccccc";
			})
			.attr("stroke-width", 10);

		nodeEnter.append("text")
			.attr("dy", "0.3em")
			.attr("x", d => d._children ? -6 : 6)
			.attr("text-anchor", d => d._children ? "end" : "start")
			.text(d => d.data.name)
			.clone(true).lower()
			// .attr("class", (d) => {
			// 	if (d.data.numObservations > 0) {
			// 		return { color: "#4286f4" };
			// 	}
			// 	return { color: "#555555" };
			// })
			.attr("stroke-linejoin", "round")
			.attr("stroke-width", 3)
			.attr("stroke", "white");

		// Transition nodes to their new position
		const nodeUpdate = node.merge(nodeEnter).transition(transition)
			.attr("transform", d => `translate(${d.y},${d.x})`)
			.attr("fill-opacity", 1)
			.attr("stroke-opacity", 1);

		// Transition exiting nodes to the parent's new position
		const nodeExit = node.exit().transition(transition).remove()
			.attr("transform", d => `translate(${source.y},${source.x})`)
			.attr("fill-opacity", 0)
			.attr("stroke-opacity", 0);

		// Update the links
		const link = gLink.selectAll("path")
			.data(links, (d) => {
				return d.target.id;
			})
			.attr('stroke', (d) => {
				return d.target.data.numObservations > 0 ? '#4286f4' : '#555555';
			});

		// Enter any new links at the parent's previous position
		const linkEnter = link.enter().append("path")
			.attr("d", d => {
				const o = {x: source.x0, y: source.y0};
				return diagonal({source: o, target: o});
			})
			.attr('stroke', (d) => {
				return d.target.data.numObservations > 0 ? '#146dff' : '#555555';
			});

		// Transition links to their new position
		link.merge(linkEnter).transition(transition)
			.attr("d", diagonal);

		// Transition exiting nodes to the parent's new position
		link.exit().transition(transition).remove()
			.attr("d", d => {
				const o = {x: source.x, y: source.y};
				return diagonal({source: o, target: o});
			});

		// Stash the old positions for transition
		root.eachBefore(d => {
			d.x0 = d.x;
			d.y0 = d.y;
		});
	}

	render() {
		return <div />;
	}
}

export default Graph;

