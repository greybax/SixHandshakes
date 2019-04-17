let famousPeople = () => {
  let famousIds = [1, 164542053, 60731512, 1756972, 6270260, 10940602, 270930,
    53083705, 45269508, 49794138, 2128351, 2677959, 87896266, 80491907, 38940203,
    10374507, 39377403, 44625516, 8945993, 254585226, 14277664, 26862653, 146303427,
    44770528, 12299826, 123477727, 1394120, 1734481, 134791540, 1343527, 2447974, 666140,
    1784000, 238674377, 55325758, 154686894, 1655278, 35057592, 4437848, 7708047,
    49286014, 5074235, 9063356, 20020126, 81133993, 47463722, 20484180, 51663629,
    16569242, 41110630, 55114192, 119910902, 13730491, 33888226, 1309724, 4486538,
    32707600, 52119178, 142935779, 3819365, 147614893, 2207888, 43787823, 93388,
    96787935, 833621, 5128949, 94871197, 390765, 186607425, 141635901, 135234,
    184616912, 55136424, 3684242, 1915144, 11547416, 2615791, 1873847, 79201190,
    10559979, 12086666, 135336811, 72388438, 217859055, 2881826, 7039106, 5394141,
    74849047, 6012030, 3327485, 10342428, 164123622, 3883830, 2636188, 175188694,
    363860, 246488014, 3460930, 163656220, 17717675, 12424516, 93808169, 11760214,
    153717296, 211919952, 1399678, 1361100, 2355651, 141927888, 2963876, 16971887,
    27599714, 8005365, 210436118, 41949090, 155697060, 13641471, 92543641, 220349311,
    2645193, 120736856, 14799510, 160143720, 216291902, 11481439, 1493537, 7875950,
    5592362, 4958393, 7147638, 8613652, 9239849, 7148238, 11402201, 5401645, 13082236,
    6686484, 19439900, 56414432, 125023440, 10653558, 26673281, 5781982, 62896960,
    14404543, 192208838, 115534183, 155990526, 12489927, 45374530, 5857176, 13605301,
    3716343, 82029701, 4926666, 18486159, 173100036, 2850237, 5670993, 69409723, 11444843,
    30037100, 72276111, 33850323, 336279, 177709874, 16821412, 25606049, 104916144, 631602,
    24243860, 96545624, 176250659, 120710181, 114128268, 3028766, 51387579, 94932515, 135612271,
    173725684, 7816368, 81258, 859412, 7696456, 210963617, 105023379, 40434887, 96847603,
    150985170, 153151548, 64809187, 9906987, 86833240, 8474067, 152317998, 89344688, 173349089,
    166523969, 20785946, 5257328, 777, 4584570, 31069740, 25160434, 11512197, 4686678,
    13704629, 19452249, 199378676, 15394583, 72155373, 5126033, 1447159, 3508226, 1786972,
    3041792, 69994512, 155061, 3538438, 238615607, 1138489, 5099843, 3377272, 124633002,
    3121647, 692393, 89409961, 209992, 129244038, 210573159, 37862384, 19638657, 182973058,
    133862729, 541370, 1676192, 715211, 12642023, 192651981, 8694173, 11387359, 227058817,
    13816360, 20114959, 169653711, 225693587, 4082111, 12642792, 3620111, 209991765, 11912860,
    8117231, 3854255, 124689585, 146739174, 18425009, 5795119, 200631386, 1178031, 97373810,
    649360, 4128605, 254679349, 174594973, 212340337, 3308952, 171790932, 41362423];

  return {
    load: () => {
      // get famous people data
      VK.api('users.get', {
        user_ids: famousIds.join(),
        fields: 'photo_100,city,country,online,domain,counters'
      }, (data) => {
        let peopleData = data.response;

        peopleData.forEach((people) => {
          $('#mainboxPeoplesStars').append(`<img src="${people.photo_100}" alt="" onclick="getUser('${people.id}');" />`);
        });
      });
    }
  };

}

// module.exports = famousPeople;