(() => {
  const reader = document.querySelector('.folio-reader');
  const choices = reader.querySelector('fieldset');
  const answer = reader.querySelector('.reader-answer');
  const source = reader.querySelector('.reader-source');
  const turn = reader.querySelector('.reader-turn');
  const status = reader.querySelector('.reader-status');
  const passages = {
    leave: {
      answer: answer.querySelector('p').textContent,
      section: 'Time off',
      excerpt: source.querySelector('mark').textContent,
      context: ' Their manager reviews and approves the dates.'
    },
    hours: {
      answer: 'The handbook sets core collaboration hours from 10 am to 3 pm.',
      section: 'Working hours',
      excerpt: 'Core collaboration hours are 10 am to 3 pm.'
    },
    balance: {
      answer: 'The handbook explains how to request time off. It gives no annual vacation allowance, so this document cannot answer that question.',
      section: 'Time off',
      context: source.querySelector('blockquote').textContent
    }
  };
  function displayFace(showSource) {
    reader.classList.toggle('show-source', showSource);
    answer.setAttribute('aria-hidden', String(showSource));
    source.setAttribute('aria-hidden', String(!showSource));
    const related = choices.elements['folio-question'].value === 'balance';
    turn.textContent = showSource ? '← Back to answer' : related ? 'Inspect related passage →' : 'Read cited passage →';
  }
  choices.addEventListener('change', event => {
    const radio = event.target;
    const passage = passages[radio.value];
    answer.querySelector('h5').textContent = radio.nextElementSibling.textContent;
    answer.querySelector('p').textContent = passage.answer;
    source.querySelector('h5').textContent = passage.section;
    const quote = source.querySelector('blockquote');
    quote.replaceChildren();
    if (passage.excerpt) {
      const mark = document.createElement('mark');
      mark.textContent = passage.excerpt;
      quote.append(mark);
    }
    if (passage.context) quote.append(passage.context);
    displayFace(false);
    status.textContent = passage.answer;
  });
  turn.addEventListener('click', () => {
    const showSource = !reader.classList.contains('show-source');
    displayFace(showSource);
    status.textContent = showSource ? source.querySelector('blockquote').textContent : answer.querySelector('p').textContent;
  });
  choices.hidden = false;
  turn.hidden = false;
  reader.classList.add('reader-ready');
  displayFace(false);
})();
