(() => {
  const sections = document.querySelectorAll('.rail-section');
  const stops = [0, 90, 184];
  const labels = ['기대기', '걸터앉기', '앉기'];
  const controls = ['diagramUpper', 'diagramLower'].map(id => document.getElementById(id));

  function showPose(mode) {
    const frame = window.staygapSide.frame(stops[mode]);
    for (const group of sections) {
      window.staygapSide.draw(group, frame);
      group.querySelector('.signal').setAttribute('fill', mode ? '#79ad52' : '#be4557');
      group.querySelector('.pose-label').textContent = labels[mode];
    }
    window.sideRailJoints = frame.joints;
    controls.forEach((control, i) => {
      control.setAttribute('transform', `translate(${frame.joints[i].join(' ')})`);
    });
    document.dispatchEvent(new Event('staygap:sideframe'));
  }

  document.addEventListener('staygap:mode', event => showPose(event.detail));
  showPose(0);
})();
