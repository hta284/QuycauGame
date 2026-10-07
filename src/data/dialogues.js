// Dialogue System Data
export const DIALOGUES = {
  ba_lan: {
    name: "Bà Lan",
    portrait: "/assets/character/batu/Gemini_Generated_Image_52noiq52noiq52no.png",
    default: {
      text: "Cháu về làng lúc này làm gì hả Nam?! Làng dạo này lạ lắm... Mau vào nhà đóng kín cửa lại đi!",
      options: [
        { text: "Cháu đang tìm em gái. Bà có thấy con bé không?", next: "step_ask_relative" },
        { text: "Bà có nghe thấy tiếng động gì ngoài đường không?", next: "step_sounds" }
      ]
    },
    step_ask_relative: {
      text: "Con Lan Chi ấy hả... Chiều tối qua bà thấy nó hớt hải chạy về phía đình làng rồi hướng ra giếng cổ. Nhưng cháu tuyệt đối đừng ra phía cái giếng lúc đêm hôm thế này!",
      options: [
        { text: "Tại sao không được ra giếng hả bà?", next: "step_why_well" },
        { text: "Cảm ơn bà, cháu phải đi tìm em ngay!", next: "close" }
      ]
    },
    step_why_well: {
      text: "Ở đó... có thứ không nên nhìn thấy! Mấy ngày nay nửa đêm nước giếng cứ sôi lục bục, rồi có tiếng móng vuốt cào trên nền đá... Đừng gọi tên nó, đừng để nó ngửi thấy mùi người!",
      options: [
        { text: "Cháu hiểu rồi, cháu sẽ cẩn thận.", next: "close", advanceQuest: "Q02" }
      ]
    },
    step_sounds: {
      text: "Đêm nào cũng có tiếng thở khò khè của loài thú lớn quanh vách nhà... Gà vịt trong chuồng chết sạch mà không mất giọt máu nào, chỉ có vết cắn rách cổ họng thôi...",
      options: [
        { text: "Cháu sẽ điều tra chuyện này.", next: "close" }
      ]
    }
  },

  ong_tu: {
    name: "Ông Tư",
    portrait: "/assets/character/ong lam/Gemini_Generated_Image_cj76vacj76vacj76.png",
    default: {
      text: "Cậu Nam đấy à? Ba mươi năm trước làng này từng một phen náo loạn vì một con linh khuyển bị yểm tà thuật. Cứ tưởng nó đã chết rục dưới đáy vực rồi...",
      options: [
        { text: "Con linh khuyển đó là thứ gì vậy ông?", next: "step_legend" },
        { text: "Cháu nghe nói ở nghĩa địa có dấu tích lạ?", next: "step_graveyard" }
      ]
    },
    step_legend: {
      text: "Đó là Quỷ Cẩu! Nó không phải con chó bình thường. Thân hình nó gầy trơ xương, cao lớn như người, ban ngày chui rúc nơi u tối, đêm xuống mới hiện thân hút sinh khí để hồi sinh ma lực!",
      options: [
        { text: "Làm sao để tiêu diệt được nó?", next: "step_destroy" }
      ]
    },
    step_destroy: {
      text: "Xưa kia các cụ phải dùng 3 bệ thờ kết hợp bùa chu sa và ngọn lửa thiêng ở Miếu Cũ mới trấn áp được nó. Hãy cẩn thận, nó đánh hơi được người sợ hãi!",
      options: [
        { text: "Cháu sẽ đến nghĩa địa tìm thêm manh mối.", next: "close" }
      ]
    },
    step_graveyard: {
      text: "Khu nghĩa địa đằng sau đình làng đêm nay bốc mùi tử khí nồng nặc. Có người bảo thấy bóng một con thú đen khổng lồ đứng trên bia mộ cổ... Hãy cầm chắc đèn pin!",
      options: [
        { text: "Cháu cảm ơn ông Tư.", next: "close" }
      ]
    }
  },

  minh: {
    name: "Minh",
    portrait: "/assets/character/danlangnam/Gemini_Generated_Image_uvl7i9uvl7i9uvl7.png",
    default: {
      text: "Anh Nam! Em ban đầu cũng tưởng chuyện Quỷ Cẩu chỉ là mấy người già dọa trẻ con... Cho tới khi chập tối nay em tận mắt thấy một cái bóng đen khổng lồ nhảy qua mái đình!",
      options: [
        { text: "Em có thấy nó chạy về hướng nào không?", next: "step_saw_direction" },
        { text: "Em có thấy em gái anh không?", next: "step_saw_sister" }
      ]
    },
    step_saw_direction: {
      text: "Nó tha theo một dải vải đỏ lao thẳng vào rừng cấm phía sau miếu! Tốc độ của nó nhanh như gió, mắt đỏ như hòn than cháy!",
      options: [
        { text: "Chính là hướng vào Miếu Cũ...", next: "close" }
      ]
    },
    step_saw_sister: {
      text: "Em thấy chị Hạnh nói chuyện với chị Lan Chi ở gần đình lúc xẩm tối. Anh thử hỏi chị Hạnh xem sao!",
      options: [
        { text: "Cảm ơn em, Minh.", next: "close" }
      ]
    }
  },

  hanh: {
    name: "Hạnh",
    portrait: "/assets/character/danlangnu/Gemini_Generated_Image_39ese139ese139es.png",
    default: {
      text: "Anh Nam! Em là người cuối cùng gặp chị Lan Chi... Chị ấy nói hình như có ai đó dẫn dụ chị ấy tới khu nghĩa địa cũ để tìm lại di vật của gia đình...",
      options: [
        { text: "Tại sao Lan Chi lại đi một mình trong đêm?", next: "step_why_alone" },
        { text: "Em có biết gì về con đường vào rừng không?", next: "step_forest_path" }
      ]
    },
    step_why_alone: {
      text: "Chị ấy bảo nghe thấy tiếng chó của nhà nuôi ngày xưa sủa gọi ngoài đầu ngõ. Nhưng con chó đó đã chết từ 10 năm trước rồi mà anh! Quỷ Cẩu có khả năng giả giọng để dụ con mồi!",
      options: [
        { text: "Khốn nạn thật... Anh phải đến nghĩa địa ngay!", next: "close" }
      ]
    },
    step_forest_path: {
      text: "Cửa rừng bị người giữ miếu khóa lại bằng bùa chú rồi. Anh phải tìm ông ấy để mở cửa!",
      options: [
        { text: "Cảm ơn em rất nhiều.", next: "close" }
      ]
    }
  },

  thay_cung: {
    name: "Người Giữ Miếu",
    portrait: "/assets/character/thaycung/Gemini_Generated_Image_8z8ejx8z8ejx8z8e.jpg",
    default: {
      text: "Cậu thanh niên... Huyết thống nhà họ Trần cuối cùng cũng đã về. Con nghiệt súc kia đang giam giữ người thân của cậu trong Miếu Cũ để tế trăng máu!",
      options: [
        { text: "Xin ông chỉ cách cứu em gái cháu!", next: "step_guide_ritual" },
        { text: "Tại sao nó lại nhắm vào gia đình cháu?", next: "step_why_family" }
      ]
    },
    step_guide_ritual: {
      text: "Cầm lấy 'Bùa Trấn Yểm' này (CLUE 08)! Thân xác Quỷ Cẩu lúc này được bao bọc bởi lớp khí tà bất khả xâm phạm. Cậu phải thắp sáng 3 Bệ Thờ quanh miếu để hóa giải, sau đó dùng Ngọn Lửa Thiêng trên đàn tế để thiêu rụi nó!",
      options: [
        { text: "Cháu đã sẵn sàng. Hãy mở lối vào rừng!", next: "step_open_forest" }
      ]
    },
    step_why_family: {
      text: "Tổ tiên cậu từng là người phong ấn nó 30 năm trước. Nó muốn nuốt trọn giọt máu cuối cùng để phá vỡ vĩnh viễn lời nguyền giam cầm!",
      options: [
        { text: "Cháu nhất định sẽ diệt trừ nó!", next: "step_guide_ritual" }
      ]
    },
    step_open_forest: {
      text: "Cửa rừng đã mở! Hãy nhớ: Khi nó lao tới, hãy nấp sau các cột đá và không được dừng lại. Số phận người thân nằm trong tay cậu!",
      options: [
        { text: "Tiến vào Miếu Cũ!", next: "close", advanceQuest: "Q05" }
      ]
    }
  },

  lan_chi: {
    name: "Lan Chi (Người Thân)",
    portrait: "/assets/character/nguoiphunubian/Gemini_Generated_Image_jpvolvjpvolvjpvo.png",
    default: {
      text: "Anh Nam... Em biết anh sẽ đến cứu em mà... Cẩn thận phía sau! Con quỷ đó... nó đang quay lại!",
      options: [
        { text: "Đừng sợ, anh sẽ bảo vệ em và tiêu diệt nó!", next: "close" }
      ]
    }
  }
};
