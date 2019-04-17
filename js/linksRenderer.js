class LinksRenderer {
  constructor() {
    d3.select('svg').selectAll('*').remove();
    this.levels = [];
    this.maxIsReached = false;
  }

  // add several lines
  addLinks(array) {
    if (this.maxIsReached) {
      return;
    }

    let allFriends = this.getAllElementsOfArray(array);

    // get friends data
    VK.api('users.get', {
      user_ids: allFriends.join(),
      fields: 'photo_50,city,country,online,domain,counters'
    }, (data) => {
      let friendsData = data.response;
      array.forEach((friendLine) => {
        this.addLink(friendLine, friendsData);
      });
    });
  }

  // add one line
  addLink(array, friendsData) {
    let colWidth = Math.round($('#SvgjsSvg1000').attr('width') / array.length);
    let hPos = Math.round($('#SvgjsSvg1000').attr('width') / array.length / 2);
    let vPos = Math.round($('#SvgjsSvg1000').attr('height') / 2);
    let radius = 30;
    let maxFriendInLevel = 9;

    this.levels.forEach((level) => {
      if (level['count'] >= maxFriendInLevel) {
        this.maxIsReached = true;
      }
    });

    if (this.maxIsReached) {
      return;
    }

    //we get line with length more then already found
    if (array.length > this.levels.length && this.levels[0]) {
      return;
    }

    hideLoader();

    for (let i = 0; i < array.length - 1; i++) {
      if (!this.levels[i]) {
        this.levels[i] = [];
        this.levels[i]['count'] = 0;
      }
      if (!this.levels[i + 1]) {
        this.levels[i + 1] = [];
        this.levels[i + 1]['count'] = 0;
      }

      let vPosFirst = this.getvPos(i, array, vPos);
      let vPosSecond = this.getvPos(i + 1, array, vPos);

      this.drawLine(hPos + radius + 3, vPosFirst, hPos + colWidth - radius - 3, vPosSecond);

      // if not exists friend then create new
      if (!this.levels[i][array[i]]) {
        let data = this.getFriendData(array[i], friendsData);
        let fullName = `${data.first_name} ${data.last_name}`;
        this.levels[i][array[i]] = this.drawCircle(data, hPos, vPosFirst, 25, radius);
        this.drawText(fullName, hPos, vPosFirst, radius);
        this.levels[i]['count'] = this.levels[i]['count'] + 1;
      }

      // if not exists friend then create new
      if (!this.levels[i + 1][array[i + 1]]) {
        let data = this.getFriendData(array[i + 1], friendsData);
        let fullName = `${data.first_name} ${data.last_name}`;
        this.levels[i + 1][array[i + 1]] = this.drawCircle(data, hPos + colWidth, vPosSecond, 25, radius);
        this.drawText(fullName, hPos + colWidth, vPosSecond, radius);
        this.levels[i + 1]['count'] = this.levels[i + 1]['count'] + 1;
      }

      hPos += colWidth;
    }
  }

  getFriendData(id, friendsData) {
    return friendsData.filter((friend) => {
      return friend.id == id;
    })[0];
  }

  getAllElementsOfArray(list) {
    let results = [];
    list.forEach((secondList) => {
      secondList.forEach((elem) => {
        if (results.indexOf(elem) < 0) {
          results.push(elem);
        }
      });
    });

    return results;
  }

  getvPos(i, array, vPos) {
    let result;
    if (this.levels[i][array[i]]) {
      let firstFriendCircle = this.levels[i][array[i]];
      result = firstFriendCircle[0][0].attributes['cy'].value;
    }
    else {
      let count = this.levels[i]['count'];
      let height;
      if (count % 2 == 0) {
        height = count / 2;
      }
      else {
        height = (count + 1) / 2;
      }
      result = vPos + Math.pow(-1, count) * height * 100;
    }

    return result;
  }

  // Draw methods

  drawLine(x1, y1, x2, y2) {
    d3.select('svg').append('line')
      .attr({
        'x1': x1,
        'y1': y1,
        'x2': x2,
        'y2': y2,
        'stroke': '#d9e0e7',
        'stroke-width': '2',
      });
  }

  drawCircle(userInfo, hPos, vPos, shift, radius) {
    let id = 'id5_' + hPos + '_' + vPos;
    d3.select('svg').append('svg:image')
      .attr({
        'xlink:href': userInfo.photo_50,
        'width': 50,
        'height': 50,
        'cursor': 'pointer',
        'style': 'cursor:pointer;',
        'fill': '#f7f7ff',
        'x': hPos - shift,
        'y': vPos - shift
      })
      .on('click', () => {
        d3.selectAll('.stroke5').attr('stroke', '#d9e0e7');
        d3.select('#' + id).attr('stroke', '#799dc1');

        this.drawForeignObject(userInfo, hPos, vPos, radius);
      });

    let mainCircle = d3.select('svg').append('ellipse')
      .attr({
        'class': 'stroke11_5',
        'cx': hPos,
        'cy': vPos,
        'rx': radius,
        'ry': radius,
        'stroke-width': '11.5',
        'fill': 'none',
        'stroke': '#f7f7ff',
        'style': 'cursor:pointer;'
      })
      .on('click', () => {
        d3.selectAll('.stroke5').attr('stroke', '#d9e0e7');
        d3.select('#' + id).attr('stroke', '#799dc1');

        this.drawForeignObject(userInfo, hPos, vPos, radius);
      });

    d3.select('svg').append('ellipse')
      .attr({
        'id': id,
        'class': 'stroke5',
        'cx': hPos,
        'cy': vPos,
        'rx': radius,
        'ry': radius,
        'stroke-width': '5',
        'stroke': '#d9e0e7',
        'fill': 'none',
        'style': 'cursor:pointer;'
      })
      .on('click', () => {
        d3.selectAll('.stroke5').attr('stroke', '#d9e0e7');
        d3.select(this).attr('stroke', '#799dc1');

        this.drawForeignObject(userInfo, hPos, vPos, radius);
      });

    return mainCircle;
  }

  drawText(text, hPos, vPos, radius) {
    d3.select('svg').append('text')
      .attr({
        'cursor': 'pointer',
        'style': 'font-size:11;font-family:Helvetica,Arial,sans-serif;text-anchor:middle;cursor:pointer;font-weight:bold;',
        'fill': '#5f83aa',
        'font-weight': 'bold',
        'text-anchor': 'middle',
        'font-size': '11',
        'x': hPos,
        'y': vPos + radius + 15
      })
      .text(text);
  }

  drawForeignObject(userInfo, hPos, vPos, radius) {
    d3.selectAll('foreignObject').remove();

    let foWidth = 170;
    let fo = d3.select('svg').append('foreignObject')
      .attr({
        'id': 'fo_' + hPos + '_' + vPos,
        'width': foWidth,
        'x': hPos - 2.5 * radius,
        'y': vPos - radius - 2.5 * radius,
        'class': 'svg-tooltip'
      });

    let divProfileInfo = fo.append('xhtml:div').attr('class', 'profile_info');
    let divClearFix = divProfileInfo.append('div').attr('class', 'clear_fix');
    divClearFix.append('div').attr('class', 'label fl_l').text('Город:');
    divClearFix.append('div').attr('class', 'labeled fl_l').text(userInfo.city ? userInfo.city.title : 'не указан');

    divClearFix = divProfileInfo.append('div').attr('class', 'clear_fix miniblock');
    divClearFix.append('div').attr('class', 'label fl_l').text('Страна:');
    divClearFix.append('div').attr('class', 'labeled fl_l').text(userInfo.country ? userInfo.country.title : 'не указана');

    divClearFix = divProfileInfo.append('div').attr('class', 'clear_fix miniblock');
    divClearFix.append('div').attr('class', 'label fl_l').text('Онлайн:');
    divClearFix.append('div').attr('class', 'labeled fl_l').text(userInfo.online ? 'да' : 'нет');

    divClearFix = divProfileInfo.append('div').attr('class', 'clear_fix miniblock');
    divClearFix.append('div').attr('class', 'label fl_l').text('Страница:');
    divClearFix.append('div').attr('class', 'labeled fl_l').html(`<a href="vk.com/${userInfo.domain}"> ${userInfo.domain} </a>`);

    let foHeight = divProfileInfo[0][0].getBoundingClientRect().height;
    fo.attr({
      'height': foHeight
    });
  }
}

// module.exports =  linksRenderer;
