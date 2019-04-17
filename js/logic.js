class Finder {
  constructor() {
    this.step = 25; // VK API
    this.linksAreFound = false;
    this.search_id = 1
    this.viewer_id = '';
    this.linksRenderer;

    this.linksRenderer = new LinksRenderer();
  }

  searchFriends(viewerId, searchId) {
    this.viewer_id = viewerId;
    this.search_id = searchId;

    if (this.viewer_id == this.search_id) {
      this.linksAreFound = true;
      let links = [];
      links.push(new Array(viewer_id, search_id));
      this.linksRenderer.addLinks(links);
      return;
    }

    VK.api('execute', {
      code:
        'var myFriends=API.friends.get({user_id:' + this.viewer_id + '}); ' +
        'var destFriends=API.friends.get({user_id:' + this.search_id + '}); ' +
        'var areFriends=API.friends.areFriends({user_ids:' + this.search_id + '}); ' +
        'var mutualFriends=API.friends.getMutual({source_uid:' + this.viewer_id + ', target_uid:' + this.search_id + '}); ' +
        'var mutualMyFriendsAndDest=API.friends.getMutual({source_uid:' + this.search_id + ', target_uids:myFriends.items}); ' +
        'return {"myFriends":myFriends, "destFriends" : destFriends, "areFriends": areFriends, ' +
        '		"mutualFriends": mutualFriends, "mutualMyFriendsAndDest": mutualMyFriendsAndDest};'
    }, (data) => {
      console.log('first request about friends:', data);

      let firstResponse = data.response;
      // we are friends - 1
      if (this.checkWeAreFriends(firstResponse)) {
        return;
      }

      // no friends or user is blocked
      if (!firstResponse.destFriends || firstResponse.destFriends.count == 0) {
        this.linksAreFound = true;
        console.log('no friends :(');
        hideLoader();
        showNoFriends();
        return;
      }

      // we have common friends - 2
      if (this.checkWeHaveMutualFriends(firstResponse)) {
        return;
      }

      // common friends between my friends and destination - 3
      if (this.checkFriendsBetWeenMyFriendsAndDestination(firstResponse)) {
        return;
      }

      // if we found any link then return
      if (this.linksAreFound) {
        return;
      }

      this.searchFriendsBetweenMyAndDestinationFriends(firstResponse);
    });
  }

  checkWeAreFriends(responseData) {
    if (responseData.areFriends.length > 0 && responseData.areFriends[0].friend_status == 3) {
      this.linksAreFound = true;
      let links = [];
      links.push(new Array(this.viewer_id, this.search_id));
      this.linksRenderer.addLinks(links);
    }

    return this.linksAreFound;
  }

  checkWeHaveMutualFriends(responseData) {
    if (responseData.mutualFriends.length > 0) {
      this.linksAreFound = true;
      let links = [];
      responseData.mutualFriends.forEach((friend) => {
        links.push(new Array(this.viewer_id, friend, this.search_id));
      });

      this.linksRenderer.addLinks(links);
    }

    return this.linksAreFound;
  }

  checkFriendsBetWeenMyFriendsAndDestination(responseData) {
    if (responseData.mutualMyFriendsAndDest.length > 0) {
      let links = [];
      responseData.mutualMyFriendsAndDest.forEach((common_friends) => {
        if (common_friends.common_count > 0) {
          common_friends.common_friends.forEach((friend) => {
            links.push(new Array(this.viewer_id, common_friends.id, friend, this.search_id));
          });
        }
      });

      if (links.length > 0) {
        this.linksAreFound = true;
        this.linksRenderer.addLinks(links);
      }
    }

    return this.linksAreFound;
  }

  searchFriendsBetweenMyAndDestinationFriends(responseData) {
    // getting mutual friends between my and destination' friends (search from person who has more friends) - 4
    let myFriendsCount = responseData.myFriends.items.length;
    let destFriendsCount = responseData.destFriends.items.length;
    let smallList, bigList = [];
    let bigCount = 0;
    let smallIsMyList = false;
    if (myFriendsCount < destFriendsCount) {
      smallList = responseData.myFriends.items;
      bigList = responseData.destFriends.items;
      bigCount = destFriendsCount;
      smallIsMyList = true;
    }
    else {
      smallList = responseData.destFriends.items;
      bigList = responseData.myFriends.items;
      bigCount = myFriendsCount;
    }

    let processedFriends = 0;

    // 2 request per second
    let interval = setInterval(() => {
      if (this.maxIsReached) {
        clearInterval(interval);
        return;
      }

      let commandCode = this.getMutualCommandCode(bigList, processedFriends, this.step, smallList);

      console.log('getting mutual friends between my and destination friends');
      VK.api('execute', { code: commandCode }, (data) => {
        console.log(data);
        let response = data.response;
        let links = [];

        //go by small list
        for (name in response) {
          let friendId = name.substring(3, name.length);
          let commonFriends = response[name];
          if (commonFriends) {
            // go by big list
            commonFriends.forEach((element) => {
              if (element.common_count > 0) {
                // go to common friends between my friends and dest' friends
                element.common_friends.forEach((friend) => {
                  if (smallIsMyList) {
                    links.push(new Array(this.viewer_id, element.id, friend, friendId, this.search_id));
                  }
                  else {
                    links.push(new Array(this.viewer_id, friendId, friend, element.id, this.search_id));
                  }
                });
              }
            });
          }
        }

        if (links.length > 0) {
          this.linksAreFound = true;
          this.linksRenderer.addLinks(links);
        }
      });

      processedFriends += this.step;

      if (processedFriends >= bigCount) {
        clearInterval(interval);
        this.getFriendsOfFriends(responseData.myFriends.items, responseData.destFriends.items);
      }
    }, 700);
  }

  // getting friends of my friends and friends of dest friends
  getFriendsOfFriends(myFriends, destFriends) {
    // if we found any link then return
    if (this.linksAreFound) {
      return;
    }

    let processedMyFriends, processedDestFriends = 0;
    let myFriendsFriends, destFriendsFriends = [];
    let myFriendsDone, destFriendsDone = false;

    // 2 request per second - for my friends and for dest friends
    let interval = setInterval(() => {
      if (!myFriendsDone) {
        let commandCode = this.getFriendsCommandCode(myFriends, processedMyFriends, this.step);

        console.log('getting my friends friends');
        VK.api('execute', { code: commandCode }, (data) => {
          console.log(data);

          //go by small list
          for (name in data.response) {
            let friendId = name.substring(3, name.length);
            let friends = data.response[name];
            if (friends && friends.count > 0) {
              myFriendsFriends[friendId] = [];
              friends.items.forEach((element) => {
                myFriendsFriends[friendId].push(element);
              });
            }
          }
        });
      }

      if (!destFriendsDone) {
        let commandCode = this.getFriendsCommandCode(destFriends, processedDestFriends, this.step);

        console.log('getting dest friends friends');
        VK.api('execute', { code: commandCode }, (data) => {
          console.log(data);

          //go by small list
          for (name in data.response) {
            let friendId = name.substring(3, name.length);
            let friends = data.response[name];
            if (friends && friends.count > 0) {
              destFriendsFriends[friendId] = [];
              friends.items.forEach((element) => {
                destFriendsFriends[friendId].push(element);
              });
            }
          }
        });
      }

      processedMyFriends += this.step;
      processedDestFriends += this.step;

      myFriendsDone = processedMyFriends > myFriends.length || isNaN(processedMyFriends);
      destFriendsDone = processedDestFriends > destFriends.length || isNaN(processedDestFriends);

      if (myFriendsDone && destFriendsDone) {
        clearInterval(interval);
        this.getMutualFriendsBetweenFriendsOfMyFriendsAndFriendsOfDestinationFriends(myFriends, destFriends, myFriendsFriends, destFriendsFriends);
      }
    }, 1400);
  }

  // getting mutual friends between friends of my friends and dest friends - 5
  getMutualFriendsBetweenFriendsOfMyFriendsAndFriendsOfDestinationFriends(myFriends, destFriends, myFriendsFriends, destFriendsFriends) {
    // if we found any link then return
    if (this.linksAreFound) {
      return;
    }

    let myFriendsCount = myFriends.length;
    let destFriendsCount = destFriends.length;
    let smallList = [];
    let bigList = [];
    let bigFriendsFriends = [];
    let smallCount = 0;
    let smallIsMyList = false;
    if (myFriendsCount < destFriendsCount) {
      smallList = myFriends;
      bigList = destFriends;
      smallCount = myFriendsCount;
      smallIsMyList = true;
      bigFriendsFriends = destFriendsFriends;
    }
    else {
      smallList = destFriends;
      bigList = myFriends;
      smallCount = destFriendsCount;
      bigFriendsFriends = myFriendsFriends;
    }

    let processedFriends = 0;
    let processedFriendsBigList = 0;
    let currentPartOfBigListProcessed = true;
    let stepByBigList = 5; //5 * 300 friends = 1500 friends
    let partOfBigList = [];
    let bigFriendsFriendsLength = this.getLengthOfArray(bigFriendsFriends);

    // 2 request per second
    let interval = setInterval(() => {
      if (this.maxIsReached) {
        clearInterval(interval);
        return;
      }

      if (currentPartOfBigListProcessed) {
        currentPartOfBigListProcessed = false;
        partOfBigList = this.getPartOfList(bigFriendsFriends, processedFriendsBigList, stepByBigList);
        processedFriends = 0;
      }

      let commandCode = this.getMutualCommandCode(smallList, processedFriends, this.step, partOfBigList);
      console.log('last chance');
      VK.api('execute', { code: commandCode }, (data) => {
        console.log(data);
        let response = data.response;

        let links = [];

        //go by small list
        for (name in response) {
          let friendId = name.substring(3, name.length);
          let commonFriends = response[name];
          if (commonFriends) {
            // go by big list
            commonFriends.forEach((element) => {
              if (element.common_count > 0) {
                console.log('common_count > 0');
                // go to common friends between my friends and dest' friends friends
                element.common_friends.forEach((friend) => {
                  let destFriendFriend = this.getFriendsOfThisFriend(bigFriendsFriends, element.id);
                  destFriendFriend.forEach((firstFriendOfDest) => {
                    if (smallIsMyList) {
                      links.push(new Array(this.viewer_id, friendId, friend, element.id, firstFriendOfDest, this.search_id));
                    }
                    else {
                      links.push(new Array(this.viewer_id, firstFriendOfDest, element.id, friend, friendId, this.search_id));
                    }
                  });
                });
              }
            });
          }
        }

        if (links.length > 0) {
          this.linksAreFound = true;
          this.linksRenderer.addLinks(links);
        }
      });

      processedFriends += this.step;

      if (processedFriends >= smallCount) {
        currentPartOfBigListProcessed = false;
        processedFriendsBigList += stepByBigList;
        processedFriends = 0;
      }

      if (processedFriendsBigList >= bigFriendsFriendsLength) {
        clearInterval(interval);
      }
    }, 700);
  }

  getFriendsCommandCode(friends, processedFriends, count) {
    let code = "";
    for (let i = processedFriends; i < count + processedFriends && i < friends.length; i++) {
      code = code + 'var cmd' + friends[i] + '=API.friends.get({user_id:' + friends[i] + '});';
    }

    code = code + "return {";

    for (let i = processedFriends; i < count + processedFriends && i < friends.length; i++) {
      code = code + '"cmd' + friends[i] + '":cmd' + friends[i] + ',';
    }

    code = code.substring(0, code.length - 1);
    code = code + "};";

    return code;
  }

  getMutualCommandCode(myFriends, processedFriends, count, destFriendsFriends) {
    let code = "";
    for (let i = processedFriends; i < count + processedFriends && i < myFriends.length; i++) {
      code = code + 'var cmd' + myFriends[i] + '=API.friends.getMutual({source_uid:' + myFriends[i] + ', target_uids:"' + destFriendsFriends + '"});';
    }

    code = code + "return {";

    for (let i = processedFriends; i < count + processedFriends && i < myFriends.length; i++) {
      code = code + '"cmd' + myFriends[i] + '":cmd' + myFriends[i] + ',';
    }

    code = code.substring(0, code.length - 1);
    code = code + "};";

    return code;
  }

  getPartOfList(list, processed, count) {
    let results = [];
    let dict = {};
    let realIndex = 0;
    for (let indx in list) {
      if (!isNaN(indx)) {
        let secondList = list[indx];
        if (realIndex >= processed && realIndex < count) {
          secondList.forEach((elem) => {
            let key = elem.toString();
            if (!dict[key]) {
              dict[key] = true;
              results.push(elem);
            }
          });
        } else {
          break;
        }

        realIndex++;
      }
    };

    return results;
  }

  getLengthOfArray(array) {
    let length = 0;
    for (let indx in array) {
      if (!isNaN(indx)) {
        length++;
      }
    }

    return length;
  }

  getFriendsOfThisFriend(friends, elem) {
    let result = [];

    // go by friends of friends
    for (friendId in friends) {
      if (friends[friendId].indexOf(elem) >= 0) {
        result.push(friendId);
      }
    };

    return result;
  }

}

// module.exports = finder;
