import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import '../components/Heatmap.css';  // Ensure Heatmap.css is imported

const stopWords = [
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
  'weren\'t', 'what', 'what\'s', 'when', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
];

const Heatmap = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef(null);
  const [tooltipContent, setTooltipContent] = useState('');

  useEffect(() => {
    if (!data || !data.length) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 50, right: 25, bottom: 100, left: 150 };
    const width = 700 - margin.left - margin.right;
    const height = 650 - margin.top - margin.bottom;

    const speakers = [...new Set(data.map(d => d.speaker || d.speaker_name))];
    const timeIntervals = calculateTimeIntervals(data);
    const heatmapData = initializeHeatmapData(speakers, timeIntervals);
    populateHeatmapData(heatmapData, data, speakers, timeIntervals);

    const xScale = d3.scaleBand()
      .domain(d3.range(timeIntervals.length))
      .range([0, width])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(speakers)
      .range([0, height])
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateInferno)
      .domain([0, d3.max(heatmapData.flatMap(row => row.map(cell => cell.count)))]);

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const cells = g.selectAll('rect')
      .data(heatmapData.flatMap((row, i) => row.map((cell, j) => ({ cell, x: j, y: i }))))
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.x))
      .attr('y', d => yScale(d.cell.speaker))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.cell.count))
      .on('mouseover', handleMouseOver)
      .on('mousemove', handleMouseMove)
      .on('mouseout', handleMouseOut);

    function handleMouseOver(event, d) {
      d3.select(this)
        .style('stroke', 'black')
        .style('stroke-width', 2);

      setTooltipContent(generateTooltipContent(d.cell));
      tooltipRef.current.style.opacity = 1;
      handleMouseMove(event);
    }

    function handleMouseOut() {
      d3.select(this)
        .style('stroke', 'none');
      tooltipRef.current.style.opacity = 0;
    }

    function handleMouseMove(event) {
      tooltipRef.current.style.left = (event.pageX + 10) + 'px';
      tooltipRef.current.style.top = (event.pageY - 10) + 'px';
    }

    function calculateTimeIntervals(data) {
      const endTimes = data.map(d => d.end);
      const maxEndTime = Math.max(...endTimes);
      const numIntervals = Math.ceil(maxEndTime / 30000);
      return Array.from({ length: numIntervals }, (_, i) => i * 30);
    }

    function initializeHeatmapData(speakers, timeIntervals) {
      return speakers.map(speaker => {
        return timeIntervals.map(interval => ({
          speaker,
          interval,
          count: 0,
          words: {}
        }));
      });
    }

    function populateHeatmapData(heatmapData, data, speakers, timeIntervals) {
      data.forEach(utterance => {
        const speaker = utterance.speaker || utterance.speaker_name;
        const speakerIndex = speakers.indexOf(speaker);
        const startInterval = Math.floor(utterance.start / 30000);
        const endInterval = Math.min(Math.ceil(utterance.end / 30000), timeIntervals.length - 1);

        for (let i = startInterval; i <= endInterval; i++) {
          heatmapData[speakerIndex][i].count += 1;

          if (Array.isArray(utterance.words)) {
            utterance.words.forEach(wordObj => {
              const word = wordObj.text.toLowerCase();
              if (!stopWords.includes(word)) {
                if (!heatmapData[speakerIndex][i].words[word]) {
                  heatmapData[speakerIndex][i].words[word] = 0;
                }
                heatmapData[speakerIndex][i].words[word] += 1;
              }
            });
          }
        }
      });
    }

    function generateTooltipContent(cell) {
      const { speaker, interval, count, words } = cell;
      const timeStart = interval * 30000;
      const timeEnd = timeStart + 30000;
      const totalWords = Object.values(words).reduce((acc, curr) => acc + curr, 0);
      const uniqueWords = Object.keys(words).length;
      const percentage = ((count / data.length) * 100).toFixed(2);

      const filteredWords = Object.entries(words)
        .filter(([word]) => !stopWords.includes(word.toLowerCase()))
        .reduce((max, [word, count]) => count > max[1] ? [word, count] : max, ['', 0]);

      const topWord = filteredWords[0];

      return `
        <strong>Speaker:</strong> ${speaker}<br>
        <strong>Time:</strong> ${formatTime(timeStart)} - ${formatTime(timeEnd)}<br>
        <strong>Count:</strong> ${count}<br>
        <strong>Total Words:</strong> ${totalWords}<br>
        <strong>Unique Words:</strong> ${uniqueWords}<br>
        <strong>Percentage of Total:</strong> ${percentage}%<br>
        <strong>Top Word:</strong> ${topWord}<br>
      `;
    }

    function formatTime(milliseconds) {
      const date = new Date(null);
      date.setMilliseconds(milliseconds);
      return date.toISOString().substr(11, 8);
    }

    const yLabels = g.selectAll('.y-label')
      .data(speakers)
      .enter()
      .append('text')
      .attr('class', 'y-label')
      .attr('x', -10)
      .attr('y', d => yScale(d) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .text((d, i) => `Speaker ${i + 1}`);

    svg.append('text')
      .attr('x', margin.left)
      .attr('y', margin.top - 20)
      .attr('text-anchor', 'left')
      .style('font-size', '22px')
      .text('Conversation Heatmap');
  }, [data]);  // Dependency array

  return (
    <div className="heatmap-container">
      <h2>Conversation Heatmap</h2>
      {data && data.length > 0 ? (
        <svg ref={svgRef} width={700} height={650}></svg>
      ) : (
        <div>No data available for heatmap.</div>
      )}
      <div ref={tooltipRef} className="tooltip" dangerouslySetInnerHTML={{ __html: tooltipContent }}></div>
    </div>
  );
};

Heatmap.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    speaker: PropTypes.string,
    speaker_name: PropTypes.string,
    start: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
    words: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string.isRequired
    })),
    word_count: PropTypes.number
  })).isRequired
};

export default Heatmap;
