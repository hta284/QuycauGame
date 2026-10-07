// Dialogue System Data
export const DIALOGUES = {
  ba_lan: {
    name: "Bà Lan",
    portrait: "/assets/character/batu/Gemini_Generated_Image_52noiq52noiq52no.png",
    default: {
      text: "Nam đấy à? Lâu rồi mới thấy cháu về. Bà nghe nói Lan Chi đi khỏi nhà từ sáng, cả nhà đang lo. Cháu cứ hỏi quanh làng xem có ai gặp em nó không.",
      options: [
        { text: "Cháu đang tìm em gái. Bà có gặp em ấy không?", next: "step_ask_relative", advanceQuest: "Q02" },
        { text: "Dạo này trong làng có chuyện gì lạ không?", next: "step_sounds" }
      ]
    },
    step_ask_relative: {
      text: "Sáng nay bà thấy Lan Chi đi về phía đình. Nó có vẻ vội, nhưng bà không hỏi kịp. Cháu thử hỏi cô Hảo ngoài chợ hoặc ông Tư ở đình xem.",
      options: [
        { text: "Cháu sẽ hỏi mọi người quanh làng.", next: "close" },
        { text: "Bà có nghe gì ở giếng làng không?", next: "step_why_well" }
      ]
    },
    step_why_well: {
      text: "Chỉ nghe người ta than cái giếng lại cạn nước. Chắc là chuyện máy bơm thôi, cháu đừng nghe mấy lời đồn.",
      options: [
        { text: "Vâng, để cháu tự xem thử.", next: "close" }
      ]
    },
    step_sounds: {
      text: "Mùa này đêm hay có tiếng chó sủa vọng từ cuối làng. Chuyện thường thôi, chắc nhà ai nuôi chó.",
      options: [
        { text: "Cháu sẽ hỏi thêm mọi người.", next: "close" }
      ]
    },
    after_nightmare: {
      text: "Ác mộng thôi cháu. Mấy hôm nay cháu mệt quá nên nghe tiếng chó cũng tưởng tượng ra đủ chuyện. Đây, bà thấy dấu chân lấm bùn ngay ngoài cửa nhà cháu—chắc ai đi ngang để lại.",
      options: [
        { text: "Cháu sẽ tự kiểm tra dấu chân đó.", next: "close" }
      ]
    }
  },

  ong_tu: {
    name: "Ông Tư",
    portrait: "/assets/character/ong lam/Gemini_Generated_Image_cj76vacj76vacj76.png",
    default: {
      text: "Nam phải không? Lan Chi có ghé đình buổi sáng, hỏi đường sang khu mộ cũ. Cậu cứ hỏi thêm cô Hảo ở chợ; bà ấy thấy người qua lại nhiều hơn tôi.",
      options: [
        { text: "Cháu sẽ hỏi cô Hảo.", next: "step_legend" },
        { text: "Cháu muốn tìm khu mộ cũ.", next: "step_graveyard" }
      ]
    },
    step_legend: {
      text: "Chợ ở cạnh giếng. Có người nói thấy Lan Chi đi về phía nghĩa địa, nhưng tôi không tận mắt thấy nên đừng vội tin.",
      options: [
        { text: "Cảm ơn ông, cháu sẽ tự xác minh.", next: "close" }
      ]
    },
    step_destroy: {
      text: "Tôi chỉ biết lối vào khu mộ phía sau đình. Cứ đi theo con đường đất, ban ngày vẫn có người qua lại.",
      options: [
        { text: "Cháu hiểu rồi.", next: "close" }
      ]
    },
    step_graveyard: {
      text: "Đằng sau đình có một quyển sổ cũ bị bỏ quên. Có lẽ nó ghi lại chuyện của người trong làng.",
      options: [
        { text: "Cháu sẽ tìm thử.", next: "close" }
      ]
    }
  },

  shopkeeper: {
    name: "Cô Hảo",
    portrait: "/assets/character/danlangnu/Gemini_Generated_Image_39ese139ese139es.png",
    default: {
      text: "Nam về đúng lúc đấy. Sáng nay Lan Chi hỏi đường sang đình rồi đi mất. Ông Tư chắc biết rõ hơn tôi; ông ấy đang ở phía nghĩa địa.",
      options: [
        { text: "Cô có thấy em cháu đi một mình không?", next: "more" },
        { text: "Cháu cảm ơn cô.", next: "close" }
      ]
    },
    more: {
      text: "Có, nhưng lúc đó trong làng vẫn đông người. Cháu cứ hỏi ông Tư, đừng tự suy diễn từ mấy lời đồn ngoài chợ.",
      options: [{ text: "Cháu sẽ hỏi ông ấy.", next: "close" }]
    }
  },

  minh: {
    name: "Minh",
    portrait: "/assets/character/danlangnam/Gemini_Generated_Image_uvl7i9uvl7i9uvl7.png",
    default: {
      text: "Anh Nam! Em vừa gặp chị Lan Chi ở đình. Chị ấy hỏi đường ra khu mộ cũ rồi đi về phía đó. Anh thử hỏi chị Hạnh, chị ấy đi cùng một đoạn.",
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
      text: "Chị Hạnh đi cùng Lan Chi một đoạn. Chị ấy chắc còn ở gần đình.",
      options: [
        { text: "Cảm ơn em, Minh.", next: "close" }
      ]
    }
  },

  hanh: {
    name: "Hạnh",
    portrait: "/assets/character/danlangnu/Gemini_Generated_Image_39ese139ese139es.png",
    default: {
      text: "Anh Nam, em gặp Lan Chi lúc sáng. Chị ấy nói muốn tự tới khu mộ cũ tìm một món đồ của gia đình. Em tưởng chị ấy đã nói với anh.",
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
      text: "Cậu tìm Lan Chi phải không? Tôi thấy dấu chân của em ấy dẫn vào rừng, nhưng chuyện trong rừng không giống một cuộc đi dạo. Nếu muốn vào, hãy cầm lấy lá bùa này và đừng rời khỏi lối mòn.",
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
