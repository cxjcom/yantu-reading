window.onerror=function(m,u,l,c){try{document.title='E@'+l+': '+String(m).slice(0,120);}catch(e){}};

/* =====================================================
   研途阅读 —— 考研英语阅读无限生成器（纯本地，无需联网）
   引擎原理：考研风格长难句模板 × 随机实体（人名/机构/数据/主题）
   每句英文与中文一一对应存储，保证翻译逐句对齐。
===================================================== */

/* ---------- 公共语料 ---------- */
const RESEARCHERS = [
  {en:"Dr. Eleanor Hartley", cn:"埃莉诺·哈特利博士"},
  {en:"Prof. Daniel Okafor", cn:"丹尼尔·奥卡福教授"},
  {en:"Dr. Maria Vasquez", cn:"玛丽亚·巴斯克斯博士"},
  {en:"Prof. Thomas Lindgren", cn:"托马斯·林德格伦教授"},
  {en:"Dr. Aisha Rahman", cn:"艾莎·拉赫曼博士"},
  {en:"Prof. Michael Chen", cn:"迈克尔·陈教授"},
  {en:"Dr. Sofia Bianchi", cn:"索菲娅·比安基博士"},
  {en:"Prof. James Whitmore", cn:"詹姆斯·惠特莫尔教授"}
];
const INSTS = [
  {en:"the University of Manchester", cn:"曼彻斯特大学"},
  {en:"the University of Toronto", cn:"多伦多大学"},
  {en:"a research institute in Berlin", cn:"柏林的一家研究机构"},
  {en:"the National University of Singapore", cn:"新加坡国立大学"},
  {en:"the University of Melbourne", cn:"墨尔本大学"},
  {en:"an independent think tank in London", cn:"伦敦的一家独立智库"},
  {en:"the University of Chicago", cn:"芝加哥大学"},
  {en:"a joint research centre in Amsterdam", cn:"阿姆斯特丹的一个联合研究中心"}
];
const JOURNALS = [
  {en:"a leading international journal", cn:"一份顶尖国际期刊"},
  {en:"a peer-reviewed academic journal", cn:"一份同行评议学术期刊"},
  {en:"one of the field's most cited journals", cn:"该领域被引用最多的期刊之一"}
];
const CITIES = [
  {en:"Manchester", cn:"曼彻斯特"},{en:"Toronto", cn:"多伦多"},
  {en:"Berlin", cn:"柏林"},{en:"Singapore", cn:"新加坡"},
  {en:"Melbourne", cn:"墨尔本"},{en:"Chicago", cn:"芝加哥"},
  {en:"Amsterdam", cn:"阿姆斯特丹"},{en:"Bristol", cn:"布里斯托尔"}
];
const YEAR_POOL = ["2008","2013","2016","2019","2021","2024"];
const PCT = [
  {en:"nearly 30 percent", cn:"近30%"},
  {en:"around 40 percent", cn:"约40%"},
  {en:"more than 60 percent", cn:"超过60%"},
  {en:"almost 25 percent", cn:"将近25%"}
];
const NNUM = ["300","800","1,200","2,500","5,000"];
const MONEY = [
  {en:"120 million dollars", cn:"1.2亿美元"},
  {en:"800 million dollars", cn:"8亿美元"},
  {en:"2 billion dollars", cn:"20亿美元"}
];
const DECADES = [
  {en:"1980s", cn:"20世纪80年代"},
  {en:"1990s", cn:"20世纪90年代"},
  {en:"1970s", cn:"20世纪70年代"}
];
const CHARACTERS = [
  {en:"Margaret Doyle, a retired librarian in her seventies", cn:"玛格丽特·多伊尔——一位七十多岁的退休图书管理员",
   shortEn:"Margaret", shortCn:"玛格丽特", pEn:"she", pCn:"她", reflEn:"herself", reflCn:"她自己"},
  {en:"Sam Alvarez, a young bus driver who had just moved to the city", cn:"萨姆·阿尔瓦雷斯——一位刚搬到这座城市的年轻公交司机",
   shortEn:"Sam", shortCn:"萨姆", pEn:"he", pCn:"他", reflEn:"himself", reflCn:"他自己"},
  {en:"Ruth Kelly, a widowed nurse who ran a small bakery", cn:"露丝·凯利——一位经营着小面包店的丧偶护士",
   shortEn:"Ruth", shortCn:"露丝", pEn:"she", pCn:"她", reflEn:"herself", reflCn:"她自己"},
  {en:"George Han, an elderly watchmaker with no family nearby", cn:"乔治·韩——一位附近没有亲人的年迈钟表匠",
   shortEn:"George", shortCn:"乔治", pEn:"he", pCn:"他", reflEn:"himself", reflCn:"他自己"}
];
const ORGS = [
  {en:"a coalition of environmental groups", cn:"环保组织联盟"},
  {en:"local conservation authorities", cn:"当地自然保护部门"},
  {en:"an international wildlife fund", cn:"一个国际野生动物基金会"}
];

/* ---------- 题材库 ----------
   每个句子模板：en 英文句 / cn 对应中文 / g 语法点 / d 难度(2=强化) */

/* ---------- 通用数据段句池（数字/调查/统计，非叙事题材共用） ---------- */
const DATA_POOL = [
    {en:`According to figures released in {year}, {pct} of {npeople} said the issue had touched their lives directly.`,
     cn:`{year}年公布的数据显示，{npeople}中有{pct}表示这一问题已直接影响到他们的生活。`, g:"介词短语作状语+宾语从句", d:1},
    {en:`The numbers are hard to ignore: between {year} and {year2}, recorded cases rose by {pct}.`,
     cn:`数字难以忽视：从{year}年到{year2}年，记录在案的案例增加了{pct}。`, g:"冒号解释", d:1},
    {en:`Official statistics, however, tell only half the story, and everyone involved knows which half.`,
     cn:`然而，官方统计只讲了一半的故事，而且每个身处其中的人都知道是哪一半。`, g:"插入语+省略", d:2},
    {en:`A survey of {npeople} conducted in {year2} found attitudes shifting faster than institutions could adapt.`,
     cn:`{year2}年对{npeople}开展的一项调查发现，人们态度的转变快于机构的适应速度。`, g:"过去分词作定语+比较", d:2},
    {en:`The report estimated the total cost at {money}, a figure critics called conservative.`,
     cn:`报告估计总成本为{money}，批评者称这一数字过于保守。`, g:"同位语+过去分词", d:1},
    {en:`Behind every percentage point, researchers caution, stand real people making real compromises.`,
     cn:`研究人员提醒说，每一个百分点背后，都是正在作出真实妥协的真实的人。`, g:"倒装+插入语", d:2},
    {en:`Three separate teams have reached similar conclusions since {year}, using different methods.`,
     cn:`自{year}年以来，三个独立的团队用不同的方法得出了相似的结论。`, g:"完成时+方式状语", d:1},
    {en:`The debate has quietly spread beyond academia, reaching classrooms, newsrooms and dinner tables.`,
     cn:`这场辩论已悄然蔓延到学术界之外，进入课堂、新闻编辑室和餐桌。`, g:"现在分词作结果状语", d:1},
    {en:`By {year2}, the pattern had become too widespread to dismiss as an anomaly.`,
     cn:`到{year2}年，这一模式已蔓延到无法再被视为反常现象的地步。`, g:"too...to结构+过去完成时", d:2},
    {en:`What the figures cannot show is how unevenly the burden is shared.`,
     cn:`数字无法显示的是，负担的分配是多么不均。`, g:"what主语从句+how从句", d:2}
];

/* ---------- 背景段句池（历史缘起/大环境，非叙事题材共用） ---------- */
const BG_POOL = [
    {en:`The story began quietly, years before anyone thought to pay attention.`,
     cn:`故事的开头悄无声息，早在有人想起关注之前很多年就已开始。`, g:"过去开始时态", d:1},
    {en:`A decade ago, the issue appeared on no agenda anywhere; today it is hard to find one without it.`,
     cn:`十年前，这个问题没有出现在任何议程上；如今，几乎每份议程都绕不开它。`, g:"分号对比", d:1},
    {en:`Its roots, most historians agree, reach back to the {decade}.`,
     cn:`多数历史学家同意，它的根源可以追溯到{decade}。`, g:"插入语+主谓一致", d:1},
    {en:`What changed was not human nature, which is stubbornly constant, but the incentives around it.`,
     cn:`改变的不是人性——人性固执地恒常——而是围绕人性的种种激励。`, g:"what主语从句+插入语", d:2},
    {en:`For years the problem grew in plain sight, dismissed as the price of progress.`,
     cn:`多年来，这个问题在众目睽睽之下滋长，被当作进步的代价而未加理会。`, g:"过去分词作状语", d:1},
    {en:`Several developments, arriving almost simultaneously, pushed {subject} into the open.`,
     cn:`几乎同时到来的几件事，把{subject}推到了聚光灯下。`, g:"分词作插入语", d:1},
    {en:`The groundwork was laid decades earlier, by researchers few thought to thank at the time.`,
     cn:`基础早在几十年前就由一些研究者打下，当时很少有人想到要感谢他们。`, g:"被动语态+定语从句省略", d:2},
    {en:`Money, as usual, arrived long after the problem did.`,
     cn:`和往常一样，钱在问题出现很久之后才姗姗来迟。`, g:"比较状语从句", d:1},
    {en:`It is tempting to trace everything to a single turning point; the record is messier.`,
     cn:`人们容易把一切归因于某个单一的转折点；但实际记录要杂乱得多。`, g:"it形式主语+分号对比", d:2},
    {en:`Progress, when it finally came, arrived in fragments rather than grand reforms.`,
     cn:`进步最终到来时，是以零碎的方式，而非宏大的改革。`, g:"when插入+rather than", d:2}
];

/* ---------- 故事题材专属背景句 ---------- */
const BG_STORY = [
    {en:`{city} had never been the kind of place that made the news.`,
     cn:`{city}从来不是那种会上新闻的地方。`, g:"定语从句", d:1},
    {en:`For as long as anyone could remember, the corner shop had changed hands at least once a decade.`,
     cn:`在所有人的记忆里，街角的铺子至少十年就要换一次主人。`, g:"过去完成时", d:1},
    {en:`The block itself dated back to the {decade}, when rents were low and shops stayed open late.`,
     cn:`这栋楼本身可以追溯到{decade}，那时房租低廉，店铺营业到深夜。`, g:"when定语从句", d:1},
    {en:`Neighbours knew one another the old way: by name, by habit, by who watered whose plants.`,
     cn:`邻居们以老式的方式彼此相识：靠名字，靠习惯，靠谁帮谁浇花。`, g:"冒号+排比", d:2}
];

const TOPICS = [
/* ============ 科学研究 ============ */
{
  id:"science", name:"科学研究", emoji:"🔬",
  data:DATA_POOL,
  bg:BG_POOL,
  subjects:[
    {en:"the link between chronic sleep loss and emotional control", cn:"长期睡眠不足与情绪控制之间的联系"},
    {en:"how background noise shapes creative thinking", cn:"背景噪音如何影响创造性思维"},
    {en:"whether short bursts of daily exercise can offset the harm of prolonged sitting", cn:"每天短时锻炼能否抵消久坐带来的伤害"},
    {en:"the impact of digital reading on deep comprehension", cn:"数字阅读对深度理解能力的影响"},
    {en:"how gut bacteria quietly influence human decision-making", cn:"肠道细菌如何悄悄影响人类的决策"},
    {en:"the role of curiosity in children's language development", cn:"好奇心在儿童语言发展中的作用"}
  ],
  pool:[
    {en:"more than 1,200 volunteers", cn:"1200多名志愿者"},
    {en:"over 800 undergraduate students", cn:"800多名本科生"},
    {en:"nearly 3,000 adults", cn:"近3000名成年人"}
  ],
  titles:[
    {en:"A Closer Look at {subject}", cn:"走近{subject}"},
    {en:"New Light on {subject}", cn:"透视{subject}"},
    {en:"Rethinking {subject}", cn:"重新审视{subject}"}
  ],
  intro:[
    {en:`For decades, {subject} was dismissed as a marginal question, too elusive to be measured with any rigour.`,
     cn:`几十年来，{subject}一直被视作无关紧要的问题——过于难以捉摸，无法加以严格测量。`, g:"被动语态", d:2},
    {en:`A growing body of evidence now suggests that {subject} deserves far more attention than the scientific community has granted it.`,
     cn:`如今，越来越多的证据表明，{subject}值得比科学界目前给予的多得多的关注。`, g:"宾语从句", d:1},
    {en:`When {researcher} first began investigating {subject} in {year}, few colleagues believed the project would survive its first year.`,
     cn:`当{researcher}在{year}年开始研究{subject}时，几乎没有人相信这个项目能撑过第一年。`, g:"时间状语从句", d:1},
    {en:`Rarely has a research topic moved from academic obscurity to public debate as quickly as {subject} has in recent years.`,
     cn:`很少有哪个研究课题能像{subject}近年这样，迅速从学术冷门走向公众辩论。`, g:"倒装结构", d:2},
    {en:`In laboratories from {city} to Singapore, the same question keeps resurfacing: what exactly drives {subject}?`,
     cn:`从{city}到新加坡的实验室里，同一个问题反复浮现：究竟是什么在驱动着{subject}？`, g:"冒号解释+疑问句", d:1}
  ],
  develop:[
    {en:`In a study published in {journal}, a team led by {researcher} tracked {npeople} over {years} and found the effect far stronger than anyone had predicted.`,
     cn:`在{journal}发表的一项研究中，由{researcher}带领的团队对{npeople}进行了长达{years}的跟踪，发现其影响远超所有人的预期。`, g:"过去完成时", d:1},
    {en:`The researchers collected data from {nnum} households across {city}, controlling carefully for income, education and age.`,
     cn:`研究人员收集了{city}等地{nnum}个家庭的数据，并仔细控制了收入、教育和年龄等变量。`, g:"分词作状语", d:1},
    {en:`The findings suggest that the effect is real, measurable and — most importantly — cumulative.`,
     cn:`研究结果表明，这种影响是真实、可测量的，而且——最重要的是——会不断累积。`, g:"表语并列", d:1},
    {en:`What startled the team most was the consistency of the pattern: across every group, the results pointed in the same direction.`,
     cn:`最令团队震惊的是这种模式的一致性：在每一个群体中，结果都指向同一个方向。`, g:"主语从句", d:2},
    {en:`'We ran the analysis three times, and three times the numbers refused to go away,' {researcher} recalled.`,
     cn:`“我们把分析做了三遍，三遍的结果都顽固地指向同一结论。”{researcher}回忆道。`, g:"直接引语", d:1},
    {en:`Further experiments, though still preliminary, reinforced the impression that the link was anything but accidental.`,
     cn:`尽管仍属初步，进一步的实验强化了这样一种印象：这种联系绝非偶然。`, g:"让步状语+同位语从句", d:2},
    {en:`By {year2}, the same pattern had appeared in three separate laboratories, each working independently of the others.`,
     cn:`到{year2}年，同样的模式已在三个彼此独立的实验室中出现。`, g:"过去完成时+独立主格", d:1},
    {en:`Even so, the effect size remained modest, a fact the press release carefully avoided mentioning.`,
     cn:`即便如此，效应量仍然有限——这一点新闻稿小心地避而不谈。`, g:"同位语+定语从句", d:2},
    {en:`Crucially, the effect persisted even after the team controlled for every variable they could measure.`,
     cn:`关键在于，即使团队控制了所有能够测量的变量，这种效应依然存在。`, g:"让步状语从句", d:2},
    {en:`Replication efforts in {year2} narrowed the effect but did not eliminate it, keeping the debate alive.`,
     cn:`{year2}年的重复实验缩小了这种效应，却未能将其消除，争论由此延续。`, g:"现在分词作结果状语", d:1},
    {en:`Even under the most conservative reading, the pattern repeats across ages, regions and income groups.`,
     cn:`即使按最保守的解读，这一模式也在年龄、地区和收入群体中反复出现。`, g:"介词短语+三项排比", d:2},
    {en:`The team also tested the opposite hypothesis, and failed to find any support for it.`,
     cn:`团队还检验了相反的假设，却未能找到任何支持它的证据。`, g:"并列+动名词", d:1},
    {en:`The pattern held across every subgroup the team examined, which is rarer than it sounds.`,
     cn:`这一模式在团队考察的每一个子群体中都成立，这比听上去更罕见。`, g:"非限制性定语从句", d:2},
    {en:`Scale, however, brought its own complications: more data meant more room for doubt.`,
     cn:`然而，规模扩大也带来了新的麻烦：数据越多，怀疑的空间也越大。`, g:"冒号解释+比较", d:2},
    {en:`A second experiment, run in parallel, pointed to the same conclusion from a different angle.`,
     cn:`并行开展的第二项实验，从另一个角度指向了同样的结论。`, g:"过去分词作定语", d:1}
  ],
  debate:[
    {en:`Not everyone is persuaded. Some scholars argue that the sample was too narrow to support such sweeping claims.`,
     cn:`并非所有人都信服。一些学者认为，样本过于狭窄，不足以支撑如此笼统的结论。`, g:"宾语从句", d:1},
    {en:`Critics point out that correlation does not imply causation — a warning that has haunted this field for half a century.`,
     cn:`批评者指出，相关关系并不意味着因果关系——这一警示已经困扰该领域半个世纪。`, g:"同位语", d:1},
    {en:`Among the loudest skeptics is {researcher2}, who contends that the study overlooked a crucial variable: individual motivation.`,
     cn:`质疑声最大的是{researcher2}，后者认为该研究忽略了一个关键变量：个人动机。`, g:"倒装+非限制性定语从句", d:2},
    {en:`Funding bodies, meanwhile, remain hesitant, aware that backing a controversial field carries reputational risk.`,
     cn:`与此同时，资助机构仍持观望态度，他们清楚支持一个有争议的领域会带来声誉风险。`, g:"形容词短语作状语", d:2},
    {en:`Others take a more pragmatic view, insisting that imperfect evidence is better than no evidence at all.`,
     cn:`另一些人则持更务实的态度，坚持认为不完美的证据也胜过没有任何证据。`, g:"现在分词作状语", d:1},
    {en:`Yet the critics' alternative explanation raises questions their own data cannot answer.`,
     cn:`然而，批评者提出的替代性解释，引出了他们自己的数据也无法回答的问题。`, g:"名词所有格+定语从句省略", d:2},
    {en:`The strongest objection is not scientific but cultural: nobody enjoys being told their habits are under review.`,
     cn:`最强烈的反对并非来自科学，而是来自文化：没人喜欢被告知自己的习惯正被审视。`, g:"not...but+冒号解释", d:2},
    {en:`Accusations of cherry-picking flew in both directions, none of them proven.`,
     cn:`“挑数据”的指责满天飞，但没有一条得到证实。`, g:"独立主格", d:1},
    {en:`The disagreement, at bottom, is about what counts as evidence.`,
     cn:`说到底，分歧在于什么才算证据。`, g:"插入语+what从句", d:2}
  ],
  close:[
    {en:`Whatever the final verdict, the controversy has already forced researchers to question assumptions once taken for granted.`,
     cn:`无论最终结论如何，这场争论已经迫使研究者去质疑那些一度被视为理所当然的假设。`, g:"让步状语", d:2},
    {en:`The team now plans a larger trial, hoping to settle the question within the coming decade.`,
     cn:`该团队目前正计划一项更大规模的试验，希望在未来十年内解决这个问题。`, g:"现在分词作状语", d:1},
    {en:`Only when the evidence becomes impossible to ignore, many believe, will policymakers finally act.`,
     cn:`许多人相信，只有当证据变得无法忽视时，政策制定者才会真正采取行动。`, g:"倒装结构", d:2},
    {en:`The question is no longer whether {subject} matters, but how much — and at what cost of ignoring it.`,
     cn:`问题已不再是{subject}是否重要，而是有多重要——以及忽视它的代价几何。`, g:"no longer...but平行", d:2},
    {en:`However the data ultimately settle, the question itself has already changed the field.`,
     cn:`无论数据最终如何裁定，这个问题本身已经改变了这个领域。`, g:"however让步+完成时", d:2}
  ]
},

/* ============ 生态环保 ============ */
{
  id:"ecology", name:"生态环保", emoji:"🌿",
  data:DATA_POOL,
  bg:BG_POOL,
  subjects:[
    {en:"the decline of pollinating insects across intensively farmed land", cn:"集约化农田中传粉昆虫的减少"},
    {en:"the restoration of urban wetlands", cn:"城市湿地的修复"},
    {en:"the slow recovery of coral reefs in warmer seas", cn:"珊瑚礁在变暖海洋中的缓慢恢复"},
    {en:"microplastics accumulating in river systems", cn:"河流系统中不断累积的微塑料"},
    {en:"the return of wild animals to post-industrial cities", cn:"野生动物重返后工业城市"},
    {en:"the mounting pressure of tourism on coastal ecosystems", cn:"旅游对沿海生态系统日益加大的压力"}
  ],
  pool:[
    {en:"more than 60 field sites", cn:"60多个野外监测点"},
    {en:"over 40 rivers and streams", cn:"40多条河流溪流"},
    {en:"some 200 coastal communities", cn:"约200个沿海社区"}
  ],
  extra(){ return { org: pick(ORGS) }; },
  titles:[
    {en:"The Fight Over {subject}", cn:"围绕{subject}的博弈"},
    {en:"On the Edge: {Subject}", cn:"边缘之上：{subject}"},
    {en:"{Subject}: What the Data Show", cn:"{subject}：数据怎么说"}
  ],
  intro:[
    {en:`Along the muddy banks near {city}, a quiet experiment in ecological repair is slowly unfolding.`,
     cn:`在{city}附近泥泞的河岸旁，一场安静的生态修复实验正在缓慢展开。`, g:"现在进行时", d:1},
    {en:`For years, {subject} attracted little more than polite shrugs from policymakers.`,
     cn:`多年来，对于{subject}，政策制定者大多只是礼貌地耸耸肩。`, g:"一般过去时", d:1},
    {en:`Not until {org} published its first alarming report did the public begin to grasp the scale of the problem.`,
     cn:`直到{org}发布第一份令人担忧的报告，公众才开始意识到问题的严重程度。`, g:"倒装结构(Not until)", d:2},
    {en:`That {subject} should have become so contentious has startled even veteran conservationists.`,
     cn:`{subject}竟然会变得如此充满争议，连资深自然保护主义者也感到吃惊。`, g:"主语从句+虚拟语气", d:2},
    {en:`Few places illustrate the tension between development and conservation more vividly than the wetlands outside {city}.`,
     cn:`没有几个地方比{city}城外的湿地更能生动地展现发展与保护之间的张力。`, g:"否定比较", d:2}
  ],
  develop:[
    {en:`Between {year} and {year2}, a monitoring network covering {npeople} recorded changes that no model had anticipated.`,
     cn:`从{year}年到{year2}年，一个覆盖{npeople}的监测网络记录到了任何模型都未预料到的变化。`, g:"过去完成时", d:1},
    {en:`The pattern is sobering: where protection was weak, recovery stalled; where it was consistent, nature responded with astonishing speed.`,
     cn:`这一模式令人警醒：保护薄弱之处，恢复便陷入停滞；而保护持续之处，大自然会以惊人的速度作出回应。`, g:"where引导的状语从句+平行结构", d:2},
    {en:`Researchers estimate that {pct} of the damage could be reversed within a decade — but only if funding is sustained.`,
     cn:`研究人员估计，{pct}的破坏可在十年内得到逆转——但前提是资金能够持续投入。`, g:"宾语从句+条件状语", d:1},
    {en:`Encouragingly, species once written off as doomed have begun to reappear in restored habitats.`,
     cn:`令人鼓舞的是，曾被认定注定消失的物种已开始在修复后的栖息地重新出现。`, g:"过去分词作定语", d:2},
    {en:`The economic argument is growing harder to ignore: healthy ecosystems, {org} calculates, save cities millions in flood damage every year.`,
     cn:`经济层面的论证正变得越来越难以忽视：据{org}测算，健康的生态系统每年可为城市节省数百万的洪灾损失。`, g:"插入语", d:1},
    {en:`Satellite images tell a similar story: green cover around {city} has expanded by {pct} since {year}.`,
     cn:`卫星图像讲述着类似的故事：自{year}年以来，{city}周边的绿化面积已扩大了{pct}。`, g:"现在完成时", d:1},
    {en:`Yet recovery is uneven, and the gains, ecologists warn, could be undone within a single careless decade.`,
     cn:`然而恢复并不均衡。生态学家警告，这些成果可能毁于一个疏于管理的十年。`, g:"插入语+被动语态", d:2},
    {en:`Bird counts compiled by volunteers — many of them retired teachers — now anchor the region's scientific record.`,
     cn:`由志愿者——其中许多是退休教师——汇编的鸟类观测数据，如今构成了该地区科学记录的基石。`, g:"插入语+过去分词作定语", d:2},
    {en:`Since {year}, the area of protected land has doubled, yet enforcement on the ground remains patchy.`,
     cn:`自{year}年以来，保护地面积已经翻倍，但实际执法仍参差不齐。`, g:"yet转折+完成时", d:1},
    {en:`Where volunteers once walked transects, sensors now stream data around the clock.`,
     cn:`从前志愿者徒步样线调查的地方，如今传感器全天候源源不断地传回数据。`, g:"where从句+现在进行时", d:2},
    {en:`Two harsh winters in a row, ecologists admit, muddied the numbers more than they expected.`,
     cn:`生态学家承认，接连两个严冬对数据的干扰超出预期。`, g:"插入语+比较", d:1},
    {en:`The recovery zones now support species that had not been recorded there in living memory.`,
     cn:`修复区如今栖息着一些在世人记忆中从未在该地出现过的物种。`, g:"定语从句", d:2},
    {en:`Rangers now patrol areas that were, until recently, beyond anyone's reach.`,
     cn:`护林员如今巡逻的区域，不久前还无人能够企及。`, g:"定语从句+插入语", d:1},
    {en:`Each restored hectare, researchers note, stores carbon, filters water and shelters species at the same time.`,
     cn:`研究人员指出，每一公顷修复的土地都同时固碳、净水并为物种提供栖息地。`, g:"插入语+三项排比", d:2}
  ],
  debate:[
    {en:`Conservationists applaud the progress; farmers and developers warn that regulation is strangling local livelihoods.`,
     cn:`自然保护主义者为进展喝彩；农民和开发商则警告说，监管正在扼杀当地民生。`, g:"分号并列+宾语从句", d:1},
    {en:`Environmental groups counter that short-term profits have always been calculated at nature's expense.`,
     cn:`环保组织反驳道，短期利润从来都是以牺牲自然为代价换来的。`, g:"宾语从句", d:1},
    {en:`What the dispute really exposes, some analysts argue, is a deeper conflict about who should pay for the public good.`,
     cn:`一些分析人士认为，这场争论真正暴露的，是关于公共利益应由谁买单的更深层的冲突。`, g:"主语从句+插入语", d:2},
    {en:`Courtrooms have become the new battleground, with environmental litigation tripling since {year}.`,
     cn:`法庭已成为新的战场，自{year}年以来，环境诉讼已增至原先的三倍。`, g:"with复合结构", d:1},
    {en:`Tourism operators, facing tighter rules, complain that they are being punished for problems they did not create.`,
     cn:`面临更严格规定的旅游经营者抱怨说，他们因并非自己制造的问题而受到惩罚。`, g:"分词作状语+定语从句", d:2},
    {en:`Compromise plans have been drafted, shelved and redrafted more times than anyone can count.`,
     cn:`折中方案起草、搁置、再起草，反复的次数已经数不清。`, g:"完成时被动+排比", d:1},
    {en:`The industry's counter-proposal reads generously until one notices what it leaves out.`,
     cn:`行业的反提案读起来很慷慨——直到你注意到它略去了什么。`, g:"until从句+省略", d:2},
    {en:`Both camps, oddly, quote the same scientists in support of opposite conclusions.`,
     cn:`奇怪的是，两派引用的是同一批科学家，得出的结论却截然相反。`, g:"插入语+转折", d:2},
    {en:`Whether such legal victories translate into lasting protection, however, is far from certain.`,
     cn:`然而，这类法律上的胜利能否转化为持久的保护，还远未确定。`, g:"主语从句", d:2}
  ],
  close:[
    {en:`The fate of {subject}, most agree, will test whether societies can value what they cannot easily price.`,
     cn:`在多数人看来，{subject}最终考验的是：我们的社会能否珍视那些难以定价的东西。`, g:"插入语+宾语从句", d:2},
    {en:`The next audit, due in {year2}, will show whether the progress was real or merely well-timed.`,
     cn:`下一次审计定于{year2}年进行，届时将见分晓：进步是真实的，还是只是时机凑巧。`, g:"whether宾语从句", d:2},
    {en:`Restoration, ecologists caution, is not an event but a decades-long commitment.`,
     cn:`生态学家提醒说，修复不是一次性事件，而是长达数十年的承诺。`, g:"插入语+not...but", d:1},
    {en:`If the past decade offers any lesson, it is that nature forgives slowly — and only when given the chance.`,
     cn:`如果说过去十年有何启示，那就是：大自然的宽恕很慢——而且只在有机会时才宽恕。`, g:"条件状语从句+表语从句", d:2},
    {en:`What happens along this coastline over the next decade will be watched far beyond {city}.`,
     cn:`未来十年这条海岸线上发生的一切，影响将远远超出{city}。`, g:"主语从句", d:1}
  ]
},

/* ============ 社会心理 ============ */
{
  id:"society", name:"社会心理", emoji:"🏙️",
  data:DATA_POOL,
  bg:BG_POOL,
  subjects:[
    {en:"why so many young adults report feeling lonely", cn:"为什么这么多年轻人感到孤独"},
    {en:"the psychology of working from home", cn:"居家办公背后的心理"},
    {en:"how short videos reshape teenage attention", cn:"短视频如何重塑青少年的注意力"},
    {en:"the quiet decline of neighbourhood ties", cn:"邻里纽带的悄然淡漠"},
    {en:"why people find it harder to switch off after work", cn:"为什么人们下班后越来越难放松"},
    {en:"the return of the 'third place' in city life", cn:"城市生活中“第三空间”的回归"}
  ],
  pool:[
    {en:"more than 2,000 adults aged 18 to 35", cn:"2000多名18至35岁的成年人"},
    {en:"over 1,500 teenagers", cn:"1500多名青少年"},
    {en:"some 3,500 urban residents", cn:"约3500名城市居民"}
  ],
  titles:[
    {en:"A Quiet Shift: {Subject}", cn:"悄然之变：{subject}"},
    {en:"The Debate Over {subject}", cn:"关于{subject}的争论"},
    {en:"{Subject}: A Changing Landscape", cn:"{subject}：正在改变的图景"}
  ],
  intro:[
    {en:`In {city}, as in many cities, the question of {subject} has moved from dinner-table complaint to front-page news.`,
     cn:`与许多城市一样，在{city}，{subject}已经从餐桌上的抱怨变成了头版新闻。`, g:"现在完成时", d:1},
    {en:`Few social shifts of the past decade have been as widely discussed — and as little understood — as {subject}.`,
     cn:`过去十年中，很少有哪种社会变迁像{subject}这样被广泛讨论，却又如此少被人理解。`, g:"as...as比较+插入", d:2},
    {en:`The numbers make uncomfortable reading: in a survey of {npeople}, {pct} described their social lives as poorer than their parents'.`,
     cn:`数字读来令人不安：在对{npeople}的调查中，{pct}的受访者表示自己的社交生活不如父辈。`, g:"同位语式解释", d:1},
    {en:`That so many should feel isolated in an age of constant connection is among the great ironies of our time.`,
     cn:`在随时互联的时代竟有如此多的人感到孤独——这是我们这个时代最大的讽刺之一。`, g:"主语从句+虚拟语气", d:2},
    {en:`Behind the statistics lie individual stories that numbers alone cannot capture.`,
     cn:`统计数字背后，是数字本身无法捕捉的个人故事。`, g:"完全倒装+定语从句", d:2}
  ],
  develop:[
    {en:`A national survey of {npeople}, released in {year}, found that those who moved away from their hometowns reported weaker support networks.`,
     cn:`{year}年发布的一项针对{npeople}的全国性调查发现，离开家乡的人所报告的支持网络更为薄弱。`, g:"定语从句", d:1},
    {en:`Sociologists offer several explanations, ranging from housing costs to the pull of the smartphone.`,
     cn:`社会学家给出了多种解释，从住房成本到智能手机的吸引力，不一而足。`, g:"分词短语作定语", d:1},
    {en:`What emerges from the interviews is a generation that values flexibility over stability, often at a hidden price.`,
     cn:`访谈中浮现出的，是一代更看重灵活性而非稳定性的人——而这常常伴随着隐性代价。`, g:"主语从句+定语从句", d:2},
    {en:`Older commentators tend to blame technology; younger researchers point instead to economic pressure and shrinking public spaces.`,
     cn:`年长的评论者倾向于归咎于技术；年轻的研究者则指向经济压力和不断萎缩的公共空间。`, g:"分号对比", d:1},
    {en:`Whatever the cause, the consequences are visible: community organisations report struggling to recruit younger members.`,
     cn:`无论原因何在，后果都清晰可见：各社区组织表示，很难招募到年轻成员。`, g:"让步+动名词", d:1},
    {en:`The timing is telling: the sharpest decline coincided with the years when screens became truly portable.`,
     cn:`时间点很能说明问题：下降最剧烈的年份，恰是屏幕真正变得便携的那几年。`, g:"表语从句+定语从句", d:2},
    {en:`Not all the news is bleak: volunteering among the over-sixties, for instance, has held steady for a decade.`,
     cn:`并非全是坏消息：例如六十岁以上人群的志愿服务，十年来一直保持稳定。`, g:"部分倒装+插入语", d:1},
    {en:`Employment data tell one story; how people actually spend their evenings tells quite another.`,
     cn:`就业数据讲述着一个故事；人们晚间的实际安排则讲述着截然不同的另一个。`, g:"分号对比+how从句", d:2},
    {en:`The shift is generational as much as technological, researchers stress, which makes quick fixes unlikely.`,
     cn:`研究者强调，这种转变既是代际的也是技术的，因此不太可能一蹴而就。`, g:"as much as+which从句", d:2},
    {en:`Two community projects tried to reverse it; both ran out of volunteers within a year.`,
     cn:`两个社区项目曾试图扭转局面；都在一年之内因缺少志愿者而作罢。`, g:"分号并列+省略", d:1},
    {en:`Ironically, the groups most affected show the least interest in the meetings held about them.`,
     cn:`讽刺的是，受影响最深的群体，对为它们举办的会议最不感兴趣。`, g:"最高级+过去分词作定语", d:2},
    {en:`Since {year}, local councils have closed {pct} of the community centres they once ran.`,
     cn:`自{year}年以来，地方议会关闭了他们曾经运营的社区中心的{pct}。`, g:"完成时+定语从句省略", d:1},
    {en:`The decline is steepest exactly where community facilities were cut first.`,
     cn:`下滑最严重的地方，恰恰是社区设施最先被削减的地方。`, g:"强调副词+定语从句", d:2},
    {en:`Night classes, sports clubs and youth centres all report the same quiet shortage: people.`,
     cn:`夜校、体育俱乐部和青少年中心都报告了同样安静的短缺：人。`, g:"三项排比+冒号解释", d:1}
  ],
  debate:[
    {en:`Employers, for their part, insist that flexibility is a gift to workers, not a burden.`,
     cn:`雇主方面则坚称，灵活办公是给员工的礼物，而非负担。`, g:"插入语+宾语从句", d:1},
    {en:`Unions reply that the boundary between office and home has quietly dissolved, leaving employees always 'on call'.`,
     cn:`工会回应说，办公室与家之间的界限已悄然消融，员工永远处于“待命”状态。`, g:"现在分词作结果状语", d:2},
    {en:`The loudest voices belong to people who will not be around to live with the consequences.`,
     cn:`叫得最响的，恰恰是那些不必承受后果的人。`, g:"定语从句", d:2},
    {en:`Money committed on paper has a habit of disappearing between budgets.`,
     cn:`写在纸上的拨款，总有一种在预算之间凭空消失的习惯。`, g:"过去分词作定语+抽象表达", d:2},
    {en:`A pilot scheme in {year2} showed promise, then quietly lost its funding.`,
     cn:`{year2}年的一项试点曾带来希望，随后悄悄失去了经费。`, g:"并列+被动", d:1},
    {en:`Some policymakers advocate rebuilding 'third places' — libraries, clubs, parks — where strangers can become acquaintances.`,
     cn:`一些政策制定者主张重建“第三空间”——图书馆、俱乐部、公园——让陌生人能够变为熟人。`, g:"同位语+定语从句", d:2},
    {en:`Skeptics dismiss such schemes as cosmetic, arguing that no park can repair an economy that keeps people exhausted.`,
     cn:`怀疑者斥此类方案为表面功夫，认为任何公园都无法修复一个让人精疲力竭的经济。`, g:"现在分词作状语+定语从句", d:2},
    {en:`The debate, in other words, is less about technology than about the kind of society people wish to inhabit.`,
     cn:`换句话说，这场争论与其说关乎技术，不如说关乎人们想要栖居一个怎样的社会。`, g:"less...than比较+省略", d:2},
    {en:`What is missing from the argument, both sides concede, is any serious discussion of money.`,
     cn:`双方都承认，这场争论缺失的，是对资金问题的任何认真讨论。`, g:"主语从句+插入语", d:1}
  ],
  close:[
    {en:`Reversing the trend will require patience, money and — above all — a willingness to admit that the problem is real.`,
     cn:`扭转这一趋势需要耐心、资金，以及最重要的——承认问题真实存在的意愿。`, g:"动名词作主语+插入", d:1},
    {en:`Whether the coming decade brings repair or further erosion may depend on choices made in the next few years.`,
     cn:`未来十年究竟是修复还是进一步侵蚀，可能取决于今后几年作出的选择。`, g:"主语从句+过去分词", d:2},
    {en:`The quiet crisis, as one researcher put it, will not stay quiet forever.`,
     cn:`正如一位研究者所说，这场安静的危机不会永远安静下去。`, g:"as引导的非限制性定语从句", d:1},
    {en:`The trend, like most trends, will probably end only when something unexpected replaces it.`,
     cn:`这一趋势和大多数趋势一样，也许只有当意料之外的事物取而代之时才会终结。`, g:"插入语+被动", d:2},
    {en:`The measure of success, in five years' time, will be whether the word 'community' still means anything at all.`,
     cn:`五年后衡量成败的标准，将是“社区”一词是否还有任何实际意义。`, g:"插入语+whether表语从句", d:2}
  ]
},

/* ============ 科技与AI ============ */
{
  id:"tech", name:"科技与AI", emoji:"🤖",
  data:DATA_POOL,
  bg:BG_POOL,
  subjects:[
    {en:"the use of artificial intelligence in hiring decisions", cn:"人工智能在招聘决策中的使用"},
    {en:"algorithmic recommendations aimed at teenagers", cn:"面向青少年的算法推荐"},
    {en:"self-driving delivery vehicles", cn:"自动驾驶配送车辆"},
    {en:"who owns the personal data we leave online", cn:"我们留在网上的个人数据归谁所有"},
    {en:"the world's growing mountain of electronic waste", cn:"全球日益增多的电子垃圾"},
    {en:"smart homes that promise comfort and deliver complexity", cn:"承诺舒适却带来复杂的智能家居"}
  ],
  pool:[
    {en:"over 1,000 job advertisements", cn:"1000多条招聘广告"},
    {en:"some 2,000 adolescents", cn:"约2000名青少年"},
    {en:"more than 500 software products", cn:"500多款软件产品"}
  ],
  titles:[
    {en:"Technology's Hidden Cost: {Subject}", cn:"技术的隐性代价：{subject}"},
    {en:"{Subject}: Promise and Peril", cn:"{subject}：前景与风险"},
    {en:"The Algorithm Question: {subject}", cn:"算法之问：{subject}"}
  ],
  intro:[
    {en:`Hardly a day passes without fresh claims about {subject}; separating promise from hype has never been harder.`,
     cn:`关于{subject}的新说法几乎每天都有；要把承诺与炒作区分开来，从未如此之难。`, g:"双重否定+动名词作主语", d:1},
    {en:`Barely a week goes by without a new headline on {subject}, yet the underlying issues remain poorly understood.`,
     cn:`几乎每周都有关于{subject}的新头条，但其背后的根本问题仍然鲜有人理解。`, g:"双重否定+让步", d:1},
    {en:`Seldom has a technology been adopted so quickly and debated so intensely as {subject}.`,
     cn:`很少有哪种技术像{subject}这样，普及得如此之快，争议又如此之烈。`, g:"倒装结构", d:2},
    {en:`Behind the polished demonstrations lies a question that few companies are eager to answer.`,
     cn:`在光鲜的演示背后，潜藏着一家家公司都不愿回答的问题。`, g:"完全倒装+定语从句", d:2},
    {en:`The industry sells {subject} as inevitable; history suggests such confidence is usually premature.`,
     cn:`这个行业把{subject}包装成不可阻挡的必然；历史表明，这种自信往往为时过早。`, g:"分号对比+宾语从句", d:2}
  ],
  develop:[
    {en:`Tests conducted by regulators on {npeople} found that the systems frequently reproduced the biases of their designers.`,
     cn:`监管机构对{npeople}进行的测试发现，这些系统常常复制其设计者的偏见。`, g:"过去分词作定语+宾语从句", d:1},
    {en:`The technology, its advocates argue, is neutral; the outcomes, its critics reply, rarely are.`,
     cn:`技术本身，倡导者说，是中立的；而技术的后果，批评者回应说，却很少是中立的。`, g:"插入语+省略", d:2},
    {en:`Companies spent {money} last year alone marketing products whose inner workings even their creators struggle to explain.`,
     cn:`仅去年一年，各大公司就花费{money}营销那些连其创造者都难以解释内部原理的产品。`, g:"定语从句+强调", d:2},
    {en:`In {city}, an experiment with automated services cut waiting times — and, critics note, eliminated dozens of jobs.`,
     cn:`在{city}，一项自动化服务实验缩短了等待时间——批评者同时指出，它也削减了几十个岗位。`, g:"插入语", d:1},
    {en:`Regulators are drafting rules that would require companies to explain, in plain language, how their systems reach decisions.`,
     cn:`监管机构正在起草规则，要求公司用平实的语言解释其系统是如何作出决策的。`, g:"定语从句+宾语从句", d:1},
    {en:`Version numbers tell the story: four major updates in two years, each promising to be the last.`,
     cn:`版本号说明了问题：两年内四次大更新，每次都承诺是最后一次。`, g:"冒号解释+排比", d:1},
    {en:`The hardest problems are no longer technical; they are contractual, ethical and, above all, human.`,
     cn:`最难的问题已不再是技术问题，而是契约、伦理，以及最重要的：人的问题。`, g:"分号排比+形容词表语", d:2},
    {en:`Retraining the system takes weeks; retraining public trust takes years.`,
     cn:`重新训练系统需要数周；重新赢回公众信任需要数年。`, g:"对比排比+动名词", d:2},
    {en:`Engineers concede the point privately, even as marketing departments promise the opposite in public.`,
     cn:`工程师们私下承认这一点，而市场部门却在公开场合作出相反的承诺。`, g:"让步状语从句", d:2},
    {en:`A small experiment in {city} suggests that transparency rules can work — if the audits are genuinely independent.`,
     cn:`{city}的一项小规模实验表明，透明度规则可以奏效——前提是审计真正独立。`, g:"宾语从句+条件状语", d:1},
    {en:`Documents reviewed by this newspaper suggest the roll-out proceeded despite internal warnings.`,
     cn:`本报查阅的文件显示，尽管内部早有警告，产品上线仍一路推进。`, g:"过去分词作定语+让步", d:2},
    {en:`Engineers who built the system now spend much of their time explaining what it cannot do.`,
     cn:`当年构建系统的工程师们，如今把大量时间花在解释系统做不到什么上。`, g:"定语从句+what宾语从句", d:1},
    {en:`Every fix introduced so far has created a fresh problem for someone else to solve.`,
     cn:`迄今为止的每一次修复，都给别人制造了一个需要解决的新问题。`, g:"完成时+不定式", d:2},
    {en:`Smaller firms, unable to absorb the compliance costs, are quietly exiting the market.`,
     cn:`无力承担合规成本的小公司，正悄然退出市场。`, g:"形容词短语作定语+进行时", d:1}
  ],
  debate:[
    {en:`Civil-liberty groups warn that convenience is being purchased with an invisible currency: personal data.`,
     cn:`公民自由组织警告说，便利正以一种无形的货币支付：个人数据。`, g:"进行时被动+同位语", d:2},
    {en:`Executives counter that regulation written today will be obsolete tomorrow, freezing innovation in its tracks.`,
     cn:`企业高管反驳说，今天写就的监管明天就会过时，会把创新冻结在原地。`, g:"过去分词作定语+现在分词", d:2},
    {en:`What is striking is how little ordinary users know about the systems that shape what they see, buy and believe.`,
     cn:`令人震惊的是，普通用户对那些塑造他们所见、所购、所信的系统知之甚少。`, g:"主语从句+宾语从句嵌套", d:2},
    {en:`Some researchers propose an 'audit society', in which independent experts test algorithms as accountants audit books.`,
     cn:`一些研究者提出“审计社会”的构想：由独立专家测试算法，就像会计师审计账目一样。`, g:"非限制性定语从句+方式状语", d:2},
    {en:`Others fear that heavy-handed rules would simply push development to jurisdictions with weaker safeguards.`,
     cn:`另一些人则担心，严苛的规则只会把研发推向监管更松的地区。`, g:"宾语从句", d:1},
    {en:`Every review board created so far has been accused of grading its own homework.`,
     cn:`迄今为止成立的每一个审查委员会，都被指责在给自己批改作业。`, g:"完成时被动+动名词", d:2},
    {en:`Small start-ups complain that rules written for giants fit them like a borrowed suit.`,
     cn:`小创业公司抱怨，为巨头定制的规则穿在自己身上像借来的西装。`, g:"定语从句+明喻", d:2},
    {en:`A few firms, to their credit, have opened their logs to independent researchers.`,
     cn:`值得称道的是，少数几家公司已向独立研究者开放了日志。`, g:"插入语+完成时", d:1},
    {en:`Every proposal so far has run into the same wall: nobody agrees on who should be held accountable.`,
     cn:`迄今为止的每一项提案都撞上了同一堵墙：没有人就应由谁来负责达成一致。`, g:"冒号解释+被动结构", d:2}
  ],
  close:[
    {en:`The choices being made in laboratories today will define the boundaries of private life for a generation.`,
     cn:`今天在实验室里作出的选择，将定义整整一代人的私生活边界。`, g:"进行时被动作定语", d:1},
    {en:`Whether society masters the technology — or merely adapts to it — is still an open question.`,
     cn:`是社会驾驭技术，还是仅仅适应技术，这仍是一个悬而未决的问题。`, g:"主语从句+插入", d:1},
    {en:`History suggests that the most important debates will arrive quietly, disguised as minor technical updates.`,
     cn:`历史表明，最重要的争论往往悄然而至，伪装成一次不起眼的技术更新。`, g:"过去分词作状语", d:2},
    {en:`Whether users are ready to trade convenience for control will shape the next decade of {subject}.`,
     cn:`用户是否愿意用便利换取掌控权，将塑造{subject}的未来十年。`, g:"whether主语从句", d:2},
    {en:`The real test will come not in the lab but in the first serious failure.`,
     cn:`真正的考验不在实验室，而在第一次严重故障到来之时。`, g:"not...but强调", d:2}
  ]
},

/* ============ 经济商业 ============ */
{
  id:"economy", name:"经济商业", emoji:"💰",
  data:DATA_POOL,
  bg:BG_POOL,
  subjects:[
    {en:"the unexpected boom in second-hand markets", cn:"二手市场的意外繁荣"},
    {en:"the fragile economics of the gig economy", cn:"零工经济脆弱的经济学"},
    {en:"the slow disappearance of independent bookshops", cn:"独立书店的缓慢消失"},
    {en:"the changing meaning of brand loyalty", cn:"品牌忠诚度的含义之变"},
    {en:"the widening gap between wages and rents", cn:"工资与房租之间不断扩大的差距"},
    {en:"the rise of 'buy less, choose well' consumption", cn:"“买得更少、选得更好”消费观的兴起"}
  ],
  pool:[
    {en:"over 800 small businesses", cn:"800多家小微企业"},
    {en:"some 2,000 shoppers", cn:"约2000名消费者"},
    {en:"more than 400 retail chains", cn:"400多家零售连锁企业"}
  ],
  titles:[
    {en:"The Market Speaks: {Subject}", cn:"市场的声音：{subject}"},
    {en:"{Subject}: A New Consumer Mood", cn:"{subject}：新的消费情绪"},
    {en:"Money Matters: {Subject}", cn:"经济观察：{subject}"}
  ],
  intro:[
    {en:`Walk down almost any high street in {city} and the changes are impossible to miss.`,
     cn:`走在{city}几乎任何一条商业街上，你都不可能错过这些变化。`, g:"祈使句+and句型", d:1},
    {en:`For years, {subject} was discussed only at the margins of economic policy; today it dominates the agenda.`,
     cn:`多年来，{subject}只在经济政策的边缘被讨论；如今它已占据议程的中心。`, g:"被动语态+分号对比", d:1},
    {en:`Nothing illustrates the mood of the post-pandemic consumer more clearly than {subject}.`,
     cn:`没有什么比{subject}更能清楚地展现后疫情时代消费者的心态。`, g:"否定比较", d:1},
    {en:`So dramatic has the shift been that even the industry's fiercest optimists have begun to hedge their forecasts.`,
     cn:`这一转变如此剧烈，以至于连行业内最乐观的人也开始对预测有所保留。`, g:"So...that倒装", d:2},
    {en:`The high street in {city} tells the story in miniature: three empty units where busy shops used to be.`,
     cn:`{city}的商业街就是缩影：三家空置的铺面，那里曾是繁忙的店铺。`, g:"冒号解释+where定语从句", d:1}
  ],
  develop:[
    {en:`Since {year}, sales in the sector have grown by {pct}, a pace no analyst predicted five years ago.`,
     cn:`自{year}年以来，该行业销售额增长了{pct}，这一增速是五年前没有任何分析师预料到的。`, g:"同位语+定语从句", d:2},
    {en:`Interviews with {npeople} reveal a customer who researches relentlessly, compares obsessively and forgives slowly.`,
     cn:`对{npeople}的访谈揭示出一种新的消费者：他们反复研究、执着比价，并且不轻易原谅品牌的失误。`, g:"定语从句+平行结构", d:1},
    {en:`The arithmetic is unforgiving: rents have risen while margins have shrunk, squeezing the middle of the market hardest.`,
     cn:`账目是残酷的：租金上涨而利润率收缩，市场中间地带受到的挤压最为严重。`, g:"while对比+现在分词", d:2},
    {en:`Three chains have already announced restructuring, and a fourth is widely expected to follow.`,
     cn:`三家连锁企业已宣布重组，普遍预计第四家也会跟进。`, g:"完成时+被动语态", d:1},
    {en:`The workforce, younger and more mobile than its parents' generation, treats such news as background noise.`,
     cn:`比父辈更年轻、更具流动性的劳动力，把这类新闻当作背景噪音。`, g:"形容词作定语+插入", d:2},
    {en:`What used to be a seasonal dip now looks suspiciously like a trend line.`,
     cn:`曾经的季节性低谷，如今看起来颇为像一条趋势线。`, g:"what从句+比拟", d:2},
    {en:`Companies that once competed on novelty now advertise durability, repairability and even the absence of advertising.`,
     cn:`曾经以新奇取胜的公司，如今宣传的是耐用性、可维修性，甚至宣传自己不做广告。`, g:"定语从句", d:1},
    {en:`Behind the statistics lie thousands of individual calculations — a second job here, a delayed purchase there.`,
     cn:`统计数字背后，是无数个体的盘算——这里多打一份工，那里推迟一次消费。`, g:"完全倒装+同位语", d:2},
    {en:`The change is most visible among the young, who treat ownership as an option rather than a goal.`,
     cn:`这种变化在年轻人身上最为明显：他们把拥有视为一种可选项，而非目标。`, g:"非限制性定语从句", d:1},
    {en:`Banks, once eager to lend, have quietly tightened their standards, and the effects ripple outward from there.`,
     cn:`曾经热衷放贷的银行已悄然收紧标准，其影响由此层层向外扩散。`, g:"形容词短语作插入语+并列", d:2},
    {en:`Between {year} and {year2}, the number of independent retailers in the district fell by {pct}.`,
     cn:`从{year}年到{year2}年，该地区独立零售商的数量减少了{pct}。`, g:"完成时+数字表达", d:1},
    {en:`What the spreadsheets miss, managers admit, is how quickly customer trust evaporates once lost.`,
     cn:`经理们承认，报表看不到的是：顾客的信任一旦失去，蒸发得有多快。`, g:"what主语从句+once省略", d:2},
    {en:`Credit card data — a rough but timely gauge — confirms the shift month by month.`,
     cn:`信用卡数据——一个粗糙却及时的标尺——逐月证实了这一转变。`, g:"插入语+主谓一致", d:2},
    {en:`Landlords, investors and lenders are all reading the same signals, and all are moving carefully.`,
     cn:`房东、投资者和放贷者都在解读同样的信号，也都在谨慎行动。`, g:"三项排比+并列", d:1}
  ],
  debate:[
    {en:`Analysts disagree about whether the shift reflects values or merely emptied wallets.`,
     cn:`对于这种转变反映的是价值观，还是只是干瘪的钱包，分析师们看法不一。`, g:"宾语从句(whether)", d:1},
    {en:`Optimists call it a maturing market; pessimists see a population too anxious to spend.`,
     cn:`乐观者称之为市场的成熟；悲观者看到的则是一个焦虑得不敢消费的群体。`, g:"too...to结构+分号对比", d:1},
    {en:`What almost no one disputes is that the old growth model — sell more, faster — is running out of road.`,
     cn:`几乎无人争议的是，“卖得更多、更快”这一旧增长模式已走到尽头。`, g:"主语从句+表语从句", d:2},
    {en:`Governments, caught between voters and business lobbies, have mostly preferred to watch and wait.`,
     cn:`政府夹在选民与商业游说团体之间，大多宁愿观望等待。`, g:"过去分词作插入语", d:1},
    {en:`Some economists warn that celebrating frugality is easier for those who can afford to be frugal.`,
     cn:`一些经济学家警告说，赞美节俭是容易的——尤其是对那些付得起节俭代价的人而言。`, g:"动名词作主语+定语从句", d:2},
    {en:`Free-marketers blame red tape; protectionists blame imports; consumers, as usual, blame everyone but themselves.`,
     cn:`自由市场派归咎于繁文缛节；保护主义派归咎于进口；消费者则照例归咎于除自己以外的所有人。`, g:"三项排比+插入语", d:2},
    {en:`Interventionists and free-marketers agree on the symptoms and on almost nothing else.`,
     cn:`干预派与自由市场派对症状的看法一致，其余几乎全无共识。`, g:"排比+省略", d:2},
    {en:`Subsidies, several economists note, tend to reward the firms that least need them.`,
     cn:`几位经济学家指出，补贴往往流向最不需要补贴的企业。`, g:"插入语+定语从句", d:2},
    {en:`The last time government stepped in, the paperwork outlived the policy by a decade.`,
     cn:`上一次政府出手，政策早已结束，文书却又延续了十年。`, g:"比较+拟物", d:2}
  ],
  close:[
    {en:`Whatever one's position, the numbers suggest that consumer habits, once changed, rarely change back.`,
     cn:`无论立场如何，数据都表明：消费习惯一旦改变，很少会变回去。`, g:"让步+插入+过去分词", d:1},
    {en:`The next five years will reveal whether this is a permanent reset or a long pause.`,
     cn:`未来五年将揭示，这究竟是一场永久性的重置，还是一次漫长的停顿。`, g:"宾语从句(whether)", d:1},
    {en:`For the businesses that survive, the lesson of the decade is already clear: trust, once spent, is the costliest thing to repurchase.`,
     cn:`对幸存下来的企业而言，这十年的教训已经清晰：信任一旦耗尽，便是回购成本最高的东西。`, g:"定语从句+插入", d:2},
    {en:`Adapting, rather than resisting, may be the only strategy the coming decade rewards.`,
     cn:`未来十年唯一会有回报的战略，也许是适应，而非抗拒。`, g:"rather than结构+动名词", d:2},
    {en:`Sooner or later, the market will force a decision that politics has spent years avoiding.`,
     cn:`市场迟早会逼出一个政治界回避了多年的决定。`, g:"定语从句+完成进行时", d:2}
  ]
},

/* ============ 教育文化 ============ */
{
  id:"education", name:"教育文化", emoji:"🎓",
  data:DATA_POOL,
  bg:BG_POOL,
  subjects:[
    {en:"whether exams still measure what matters", cn:"考试是否还能衡量真正重要的东西"},
    {en:"the decline of the traditional university lecture", cn:"传统大学课堂的衰落"},
    {en:"why arts degrees are losing ground to job-focused courses", cn:"为什么人文学科学位正让位于就业导向课程"},
    {en:"the burden of homework on primary school children", cn:"小学生的课业负担"},
    {en:"bilingual education in early childhood", cn:"幼儿阶段的双语教育"},
    {en:"the role of museums in the age of short videos", cn:"短视频时代博物馆的角色"}
  ],
  pool:[
    {en:"more than 1,500 teachers", cn:"1500多名教师"},
    {en:"over 2,000 first-year students", cn:"2000多名大一新生"},
    {en:"some 600 schools", cn:"约600所学校"}
  ],
  titles:[
    {en:"Lessons Under Debate: {Subject}", cn:"争论中的课堂：{subject}"},
    {en:"{Subject}: A School at a Crossroads", cn:"{subject}：站在十字路口的学校"},
    {en:"Chalk and Change: {Subject}", cn:"粉笔与变革：{subject}"}
  ],
  intro:[
    {en:`Few institutions change as slowly as schools — and few are under as much pressure to.`,
     cn:`很少有哪种机构像学校这样变化缓慢——也很少有哪种机构承受着这样大的变革压力。`, g:"as...as比较+省略", d:2},
    {en:`The controversy over {subject}, simmering for years, has finally erupted into the open.`,
     cn:`围绕{subject}的争论酝酿多年，如今终于公开爆发。`, g:"现在分词作插入语", d:1},
    {en:`To outsiders, {subject} may sound like a technical dispute; to teachers, it is a question about the purpose of education itself.`,
     cn:`在外行看来，{subject}或许只是技术性争论；对教师而言，这是关于教育目的本身的问题。`, g:"平行结构", d:2},
    {en:`A quiet revolution in classrooms has been gathering pace since {year}, and its consequences are only beginning to show.`,
     cn:`自{year}年以来，一场安静的课堂革命不断加速，其影响才刚刚显现。`, g:"现在完成进行时", d:1},
    {en:`The arguments over {subject} are as old as mass schooling itself, yet each generation rediscovers them.`,
     cn:`关于{subject}的争论与大众教育本身一样古老，然而每一代人都在重新发现它们。`, g:"as...as比较+yet转折", d:2}
  ],
  develop:[
    {en:`A three-year study of {npeople} found that results depended less on resources than on how lessons were actually taught.`,
     cn:`一项历时三年、针对{npeople}的研究发现，成效与其说取决于资源，不如说取决于课堂实际怎么教。`, g:"less...than比较+宾语从句", d:2},
    {en:`Under the old system, success was measured by a single examination; under the new one, by a portfolio of work.`,
     cn:`旧制度下，成败系于一场考试；新制度下，则系于一份作品集。`, g:"省略+被动语态", d:2},
    {en:`Parents, unsurprisingly, are divided: some welcome the change, while others suspect their children are being used as guinea pigs.`,
     cn:`家长们不出所料地分成两派：有人欢迎改变，也有人怀疑自己的孩子正被当作实验品。`, g:"插入语+进行时被动", d:1},
    {en:`Employers add their own complaint, arguing that graduates arrive fluent in theory but hesitant in practice.`,
     cn:`雇主们也有自己的抱怨：毕业生理论娴熟，实践却犹豫不决。`, g:"现在分词作状语+形容词作状语", d:1},
    {en:`The data, though incomplete, point to a consistent pattern: improvement where teachers were properly supported, stagnation where they were not.`,
     cn:`数据虽不完整，却指向一个一致的模式：教师得到充分支持之处便有进步，反之则陷入停滞。`, g:"插入语+where状语从句省略", d:2},
    {en:`Classroom visits told a different story from the official statistics, and a far more encouraging one.`,
     cn:`课堂走访呈现出与官方统计不同的图景，而且令人鼓舞得多。`, g:"比较+替代", d:1},
    {en:`Whether the gains will survive the next round of budget cuts is the question nobody in authority wants to discuss.`,
     cn:`这些成果能否挺过下一轮预算削减，是当权者无人愿意讨论的问题。`, g:"主语从句+定语从句", d:2},
    {en:`Teachers who lived through the last reform warn that enthusiasm alone does not survive contact with a timetable.`,
     cn:`经历过上一次改革的教师警告说，光有热情，一碰到课程表就会消失。`, g:"定语从句+宾语从句", d:2},
    {en:`Class sizes, the one variable parents watch most closely, have barely moved.`,
     cn:`家长最关心的那个变量——班级规模——几乎没有变化。`, g:"同位语+完成时", d:2},
    {en:`Several head teachers have simply stopped waiting for instructions and started experimenting.`,
     cn:`一些校长干脆不再等待指示，自己开始试验。`, g:"完成时+并列动名词", d:1},
    {en:`The reforms most cited in the brochure are, on close reading, still only pilots.`,
     cn:`宣传册里被引用最多的改革，细读之下其实仍停留在试点阶段。`, g:"最高级+插入语", d:2},
    {en:`In {year2}, the ministry quietly revised figures it had published only a year earlier.`,
     cn:`{year2}年，教育部悄悄修订了它仅在一年前公布的数据。`, g:"定语从句省略+过去完成时", d:1},
    {en:`The youngest teachers, ironically, are the most enthusiastic about the oldest methods.`,
     cn:`讽刺的是，最年轻的教师对最古老的教学方法反而最有热情。`, g:"插入语+最高级对比", d:2},
    {en:`A quiet audit of attendance records found gaps that no report had mentioned.`,
     cn:`对出勤记录的一次悄悄核查，发现了任何报告都未曾提到的缺口。`, g:"过去分词作定语+定语从句", d:1}
  ],
  debate:[
    {en:`Traditionalists warn that ditching exams rewards the articulate over the knowledgeable.`,
     cn:`传统主义者警告说，取消考试会让能说会道者胜过真正有学识者。`, g:"动名词作主语", d:2},
    {en:`Reformers reply that an examination system designed for the industrial age cannot serve a digital one.`,
     cn:`改革者回应说，为工业时代设计的考试制度无法服务于数字时代。`, g:"过去分词作定语", d:1},
    {en:`At the heart of the dispute lies a question neither side can easily answer: what, precisely, is education for?`,
     cn:`争论的核心是一个双方都难以轻易回答的问题：教育究竟是为了什么？`, g:"完全倒装+定语从句省略", d:2},
    {en:`Unions want smaller classes; councils say the money simply is not there.`,
     cn:`工会要求更小的班级；地方议会则表示，根本拿不出钱。`, g:"分号对比+宾语从句", d:1},
    {en:`International comparisons, always popular with politicians, may say more about culture than about method.`,
     cn:`政客们钟爱的国际比较，反映的可能是文化差异，而非方法优劣。`, g:"插入语+more than比较", d:2},
    {en:`Parents' groups, caught between hope and fatigue, have become the loudest voice in the room.`,
     cn:`夹在希望与疲惫之间的家长团体，已成为场内最响亮的声音。`, g:"过去分词作定语", d:1},
    {en:`Every stakeholder endorses the goals and vetoes the methods, which is the problem in miniature.`,
     cn:`每一个利益相关方都赞同目标、否决方法——这正是整个问题的缩影。`, g:"并列+非限制性定语从句", d:2},
    {en:`Budget season, not pedagogy, tends to decide these fights in the end.`,
     cn:`最终决定这些争斗的，往往不是教学法，而是预算季。`, g:"强调句式", d:2},
    {en:`One pilot school reported striking gains; three others reported nothing at all.`,
     cn:`一所试点学校报告了显著的成效；另外三所则什么也没有报告。`, g:"分号对比+省略", d:1}
  ],
  close:[
    {en:`Education reforms, history suggests, succeed slowly and fail spectacularly.`,
     cn:`历史表明，教育改革成功得很慢，失败得很快。`, g:"插入语", d:1},
    {en:`The pupils now entering the classroom will, in time, judge these experiments for themselves.`,
     cn:`如今走进课堂的学生，终将亲自评判这些实验。`, g:"现在分词作定语+插入", d:1},
    {en:`What is at stake is not a curriculum but a generation's idea of what learning is for.`,
     cn:`利害攸关的不是某一套课程，而是一代人对学习目的的理解。`, g:"主语从句+not...but", d:2},
    {en:`How the current experiments end will influence classrooms far beyond this generation.`,
     cn:`当前这些实验如何收场，将影响远超这一代的课堂。`, g:"how主语从句", d:2},
    {en:`In five years, the argument may look quaint — or it may look like the moment everything turned.`,
     cn:`五年后回望，这场争论也许显得过时——也许恰恰像是一切转折的时刻。`, g:"插入+并列", d:2}
  ]
},

/* ============ 故事人生 ============ */
{
  id:"story", name:"故事人生", emoji:"📖",
  subjects:[],
  pool:[],
  data:[
    {en:`Within a month, more than {nnum} people had signed, and the local paper had taken notice.`,
     cn:`不到一个月，就有超过{nnum}人签名，当地报纸也开始关注。`, g:"过去完成时+并列", d:1},
    {en:`The sums involved were small — a few hundred in repairs — but the principle felt enormous.`,
     cn:`涉及的金额很小——几百块的修理费——但其中的原则问题却显得无比重大。`, g:"破折号插入+but转折", d:2},
    {en:`By {year2}, the corner looked different: fresh paint, fuller shelves, louder laughter.`,
     cn:`到{year2}年，街角已焕然一新：油漆鲜亮、货架充盈、笑声更响。`, g:"by+过去完成时+排比", d:2}
  ],
  bg:BG_STORY,
  extra(){
    const c = CHARACTERS[Math.floor(Math.random()*CHARACTERS.length)];
    return { who:{en:c.en,cn:c.cn}, name:{en:c.shortEn,cn:c.shortCn},
             p:{en:c.pEn,cn:c.pCn}, prefl:{en:c.reflEn,cn:c.reflCn} };
  },
  titles:[
    {en:"The Last Warm Room", cn:"最后一间温暖的屋子"},
    {en:"A Street Holds Its Breath", cn:"一条街的屏息时刻"},
    {en:"Before Dawn", cn:"黎明之前"}
  ],
  intro:[
    {en:`On a raw March morning in {year}, {who} was doing what {p} had done every single morning for two decades: making a strong cup of tea and watching the street wake up.`,
     cn:`{year}年3月一个阴冷的清晨，{who}正做着{p}二十年来每个清晨都做的事：泡一杯浓茶，看着这条街慢慢醒来。`, g:"过去进行时+宾语从句", d:1},
    {en:`Nobody in {city} would have guessed, even a year earlier, that {who} would soon find {prefl} at the centre of a neighbourhood storm.`,
     cn:`就在一年前，{city}还没有人会想到，{who}很快会发现自己正身处一场社区风波的中心。`, g:"过去将来完成时", d:2},
    {en:`The notice appeared on a Tuesday, pinned to the door without explanation: the building was to be sold.`,
     cn:`通知是在一个周二贴出来的，一言不发地钉在门上：这栋楼将被出售。`, g:"过去分词作定语+be to do", d:1},
    {en:`If you had asked {who} about the future, the answer would have been a shrug.`,
     cn:`如果你那时问{who}对未来有什么打算，得到的回答只会是耸耸肩。`, g:"虚拟语气(过去)", d:2},
    {en:`The street had seen fights like this before, but never over something so small — or so precious.`,
     cn:`这条街见过类似的争执，但从未为了如此微小——或如此珍贵——的东西。`, g:"but转折+破折号插入", d:2}
  ],
  develop:[
    {en:`For years, {p} had watched the street change: old trades closing, rents climbing, familiar faces moving away.`,
     cn:`多年来，{p}看着这条街一点点改变：老手艺关门、租金上涨、熟悉的面孔渐渐离开。`, g:"过去完成时+独立主格", d:2},
    {en:`Then, almost by accident, {p} began holding small free classes for neighbourhood children at the weekend.`,
     cn:`后来，几乎是出于偶然，{p}开始在周末为社区的孩子们开设小小的免费课堂。`, g:"一般过去时", d:1},
    {en:`What began as a favour to two neighbours grew, within a year, into something the whole street depended on.`,
     cn:`这本只是帮两个邻居的忙，一年之内却长成了整条街都离不开的事物。`, g:"what主语从句+定语从句", d:2},
    {en:`The council's plan, drafted quietly and released late on a Friday, proposed turning the block into a car park.`,
     cn:`议会的方案在周五晚间悄悄起草并发布，提议把整个街区改成停车场。`, g:"过去分词作插入语+动名词", d:1},
    {en:`By summer, the small building had become, in the words of one regular, 'the last warm room on the street'.`,
     cn:`到了夏天，用一位常客的话说，这栋小楼成了“这条街上最后一间温暖的屋子”。`, g:"过去完成时+插入语", d:2},
    {en:`There were mornings, {p} later admitted, when giving up felt like the only honest option left.`,
     cn:`{p}后来承认，有些清晨，放弃似乎是唯一诚实的选择。`, g:"插入语+定语从句", d:2},
    {en:`Help arrived from unlikely places: a rival shopkeeper, two students, an alderman who owed nobody anything.`,
     cn:`援助来自意想不到的地方：一位竞争对手、两个学生，还有一位谁都不欠的市政参事。`, g:"同位语排比+定语从句", d:1},
    {en:`By the time the council replied, three months had passed and the petition had gathered {nnum} signatures.`,
     cn:`等到议会回复时，三个月已经过去，请愿书已经收集到{nnum}个签名。`, g:"by the time+过去完成时", d:1},
    {en:`Every setback, {p} found, brought someone new to the door with an offer of help.`,
     cn:`{p}发现，每一次挫折都会带来一位新的登门者，愿意伸出援手。`, g:"插入语+不定式", d:2},
    {en:`Word travelled the old way, from doorstep to doorstep, faster than any newspaper could manage.`,
     cn:`消息以老方式口口相传，从一家门口到另一家门口，比任何报纸都快。`, g:"方式状语+比较", d:1},
    {en:`There were quieter victories too: a repaired awning here, a repainted window there.`,
     cn:`还有一些更安静的胜利：这里修好的雨棚，那里重刷的橱窗。`, g:"there be+排比", d:1},
    {en:`Nobody organised it, exactly; it happened the way weather happens.`,
     cn:`没有人去组织，一切就像天气变化一样自然发生。`, g:"分号+方式状语从句", d:2},
    {en:`By autumn, even the landlord was coming round on Fridays for a slice of cake and an argument.`,
     cn:`到秋天，连房东每周五都会过来，吃块蛋糕，拌两句嘴。`, g:"进行时+不定式", d:2},
    {en:`Some evenings the back room felt less like a shop than like a small town hall.`,
     cn:`有些傍晚，后屋与其说像店铺，不如说像一个小小的市政厅。`, g:"less...than比较", d:2}
  ],
  debate:[
    {en:`Some neighbours signed the petition without hesitation; others muttered that sentiment could not pay rent.`,
     cn:`一些邻居毫不犹豫地在请愿书上签名；另一些人则嘟囔着，情怀付不了房租。`, g:"分号对比+宾语从句", d:1},
    {en:`The landlord, polite but firm, pointed out that the building had been losing money for years.`,
     cn:`房东礼貌而坚决，指出这栋楼已经亏损多年。`, g:"形容词作插入语+过去完成进行时", d:2},
    {en:`Local reporters picked up the story, and within a week attention had spread far beyond {city}.`,
     cn:`当地记者报道了这件事；不出一周，关注就远远超出了{city}的范围。`, g:"过去完成时", d:1},
    {en:`Whether one small building can stand against the logic of the market is a question the street could not answer.`,
     cn:`一栋小楼能否抵挡市场的逻辑，是这条街回答不了的问题。`, g:"主语从句", d:2},
    {en:`Older residents remembered similar fights from the {decade}; few of them, they admitted, had ended well.`,
     cn:`年长的居民还记得{decade}的类似抗争；他们承认，其中鲜有好收场。`, g:"插入语+过去完成时", d:1},
    {en:`There was talk of compromise, though nobody could say what compromise would even look like.`,
     cn:`也有人谈起妥协，尽管没人说得清妥协究竟是什么样子。`, g:"there be句型+让步", d:1},
    {en:`Everyone had a theory, and no two theories agreed on the villain of the piece.`,
     cn:`人人都有理论，但没有两个理论认定的罪魁祸首是一样的。`, g:"并列+否定", d:2},
    {en:`Meetings were held, minutes were taken, and nothing, in the end, was decided.`,
     cn:`会议开了，纪要记了，最终却什么也没有决定。`, g:"被动排比", d:1}
  ],
  close:[
    {en:`In the end, the sale was delayed — not cancelled, merely delayed — and to the street that counted as victory.`,
     cn:`最终，出售被推迟了——不是取消，只是推迟——而在这条街看来，这就算是胜利。`, g:"插入语+被动语态", d:2},
    {en:`{name} still wakes before dawn, still puts the kettle on, and still keeps two chairs by the window for whoever needs them.`,
     cn:`{name}仍然天不亮就醒来，仍然烧上一壶水，仍在窗边摆着两把椅子，留给任何需要的人。`, g:"排比+宾语从句(whoever)", d:2},
    {en:`Some victories, the street had learned, are measured not in contracts but in time bought.`,
     cn:`这条街学到的是：有些胜利，衡量的不是契约，而是争取来的时间。`, g:"插入语+not...but+过去分词", d:2},
    {en:`Years later, people in {city} would still argue about what that summer really proved.`,
     cn:`多年以后，{city}的人们仍会争论那个夏天究竟证明了什么。`, g:"过去将来时+what宾语从句", d:2},
    {en:`The shop, the street and the story had all changed hands in a way no contract could record.`,
     cn:`店铺、街道和这个故事，都以一种契约无法记载的方式换了主人。`, g:"排比+定语从句", d:2}
  ]
}
];

/* ---------- 考研重点词汇表（自动匹配到正文中显示） ---------- */
const GLOSSARY = {
  "elusive":"难以捉摸的","marginal":"边缘的；微不足道的","rigour":"严谨","dismissed":"不予考虑；否定",
  "obscurity":"默默无闻；冷门","granted":"给予（grant）","consistency":"一致性","preliminary":"初步的",
  "accidental":"偶然的","skeptics":"质疑者","sweeping":"笼统的；一刀切的","correlation":"相关性",
  "causation":"因果关系","haunted":"困扰","variable":"变量","motivation":"动机；积极性",
  "pragmatic":"务实的","verdict":"定论；判决","controversy":"争论；争议","assumptions":"假设（assumption）",
  "trial":"试验","pollinating":"传粉的","wetlands":"湿地","coral":"珊瑚",
  "microplastics":"微塑料","habitats":"栖息地","conservationists":"自然保护主义者","litigation":"诉讼",
  "ecosystems":"生态系统","reversed":"逆转","petition":"请愿（书）","landlord":"房东",
  "livelihoods":"生计","regulation":"监管","biases":"偏见（bias）","algorithms":"算法（algorithm）",
  "jurisdictions":"司法管辖区；地区","safeguards":"保障措施","audit":"审计","obsolete":"过时的",
  "striking":"显著的；令人震惊的","hype":"炒作","survey":"调查","recruit":"招募",
  "isolation":"孤独；隔离","cosmetic":"表面功夫；装点门面的","exhausted":"精疲力竭的","frugality":"节俭",
  "margins":"利润率；边缘","durability":"耐用性","repairability":"可维修性","portfolio":"作品集；投资组合",
  "articulate":"能言善辩的","stagnation":"停滞","curriculum":"课程","guinea pigs":"实验品",
  "erupted":"爆发","simmering":"酝酿；暗涌","ironies":"讽刺（irony）","demonstrations":"演示；示威",
  "hedging":"对冲；留有余地","unforgiving":"不留情面的","novelty":"新奇","anxious":"焦虑的",
  "crossroads":"十字路口","institutions":"机构",
  "at stake":"利害攸关","by accident":"偶然地","run out of road":"走到尽头；难以为继",
  "taken for granted":"被视为理所当然","speak for themselves":"不言自明","far from certain":"远不确定",
  "anything but":"绝不是","switch off":"放松；断开","pick up the story":"报道此事",
  "third place":"第三空间","on call":"随时待命","in the words of":"用……的话说"
};

/* ---------- 背单词词库（22295 词，含音标/释义/例句；数据来源：百词斩公开词表 kajweb/dict） ---------- */
var WORD_BANK=[];   /* 词库数据在 assets/js/wordbank.js（4.3MB），按需懒加载，避免首屏解析 */
var __wbLoading=null;
function ensureWordBank(){
  if(WORD_BANK.length) return Promise.resolve(true);
  if(!__wbLoading){
    __wbLoading=new Promise(function(res,rej){
      var s=document.createElement('script');
      s.src='assets/js/wordbank.js';
      s.onload=function(){ res(true); };
      s.onerror=function(){ __wbLoading=null; rej(new Error('词库加载失败')); };
      document.head.appendChild(s);
    });
  }
  return __wbLoading;
}
/* =====================================================
   生成引擎
===================================================== */
const $ = s => document.querySelector(s);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pick = a => a[Math.floor(Math.random() * a.length)];
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pickN(a,n){ return shuffle(a).slice(0,n); }
function pickNPrefer(arr,n,preferHard){
  if(!preferHard) return pickN(arr,n);
  const hard = shuffle(arr.filter(t=>t.d===2)), rest = shuffle(arr.filter(t=>t.d!==2));
  return hard.concat(rest).slice(0,n);
}

function makeEntities(topic){
  const r = pickN(RESEARCHERS,2);
  const ys = pickN(YEAR_POOL,2).sort();          // year2 > year
  const e = {
    researcher:r[0], researcher2:r[1],
    year:ys[0], year2:ys[1],
    inst:pick(INSTS), journal:pick(JOURNALS), city:pick(CITIES),
    pct:pick(PCT), nnum:pick(NNUM), money:pick(MONEY), decade:pick(DECADES),
    years:{en:pick(["eight years","a full decade","five years","twelve years"]),
           cn:pick(["八年","整整十年","五年","十二年"])}
  };
  if(topic.pool && topic.pool.length) e.npeople = pick(topic.pool);
  if(topic.subjects && topic.subjects.length) e.subject = pick(topic.subjects);
  if(topic.extra) Object.assign(e, topic.extra());
  return e;
}

function buildDicts(e){
  const dEn={}, dCn={};
  for(const k in e){
    const v=e[k];
    const enV=(v&&typeof v==='object')?v.en:v;
    const cnV=(v&&typeof v==='object')?v.cn:v;
    dEn[k]=enV; dCn[k]=cnV;
    const K=k.charAt(0).toUpperCase()+k.slice(1);
    if(!(K in dEn)){ dEn[K]=cap(String(enV)); dCn[K]=cnV; }
  }
  return {dEn,dCn};
}

function fill(tpl, dict){
  return tpl.replace(/\{(\w+)\}/g, (m,k)=>{
    if(k in dict) return dict[k];
    throw new Error('缺少槽位 {'+k+'}');
  });
}

/* 尾句扩展：随机给部分句子接上补充成分，增加篇幅与信息量（中英同步） */
const TAILS = [
  {en:"— and the stakes are higher than they appear", cn:"——而且利害远比看上去更大"},
  {en:", at least for now", cn:"，至少目前如此"},
  {en:"— whether one likes it or not", cn:"——无论人们是否乐意"},
  {en:", and the trend shows no sign of reversing", cn:"，而且这一趋势毫无逆转迹象"},
  {en:", even when the evidence remains incomplete", cn:"，即使证据仍不完整"},
  {en:"— a shift few institutions were prepared for", cn:"——这场转变几乎没有机构做好准备"},
  {en:", though the pace varies widely across regions", cn:"，不过各地区进度差异很大"},
  {en:"— a point on which experts broadly agree", cn:"——这是专家们大体认同的一点"},
  {en:", and the costs are far from trivial", cn:"，而代价也绝非微不足道"},
  {en:"— however imperfect the current remedies may be", cn:"——无论当前的补救措施多么不完善"},
  {en:", as earlier waves of reform have already shown", cn:"，正如此前几轮改革所表明的"},
  {en:"— a balance that is easier to describe than to strike", cn:"——这种平衡说来容易，做起来难"},
  {en:", often with consequences that outlast the programs themselves", cn:"，其影响往往比项目本身更持久"},
  {en:"— provided the funding does not quietly disappear", cn:"——前提是资金不会悄悄消失"},
  {en:", a caution that history has repeated more than once", cn:"——历史的这一提醒已不止一次应验"},
  {en:"— and the window for action is narrowing", cn:"——而行动的窗口正在收窄"}
];

function maybeExtend(s, p, usedTails){
  if(Math.random() > p) return s;
  if(!/[^'"]\.$/.test(s.en) || s.en.includes('—')) return s;
  if(!s.cn.endsWith('。') || s.cn.includes('“')) return s;
  /* 尾句篇内去重：优先取未用过的尾巴；用尽则跳过续尾，绝不重复 */
  const fresh = usedTails ? TAILS.filter(t=>!usedTails.has(t)) : TAILS;
  if(!fresh.length) return s;
  const t = pick(fresh);
  if(usedTails) usedTails.add(t);
  const head = s.en.slice(0,-1).trimEnd() + (t.en.startsWith('—') ? ' ' : '');
  return { en: head + t.en + '.', cn: s.cn.slice(0,-1) + t.cn + '。', g: s.g };
}

/* 四档难度：四级 → 六级 → 考研标准 → 考研强化（paras 为段落分块，数据句并入相邻段） */
/* 难度计划（2026-11-15 按官方考试大纲校准）：
   四级仔细阅读 300-350 词/篇 → 计划 20 句 ≈ 340 词、5-6 段
   六级仔细阅读 400-450 词/篇 → 计划 25 句 ≈ 430-460 词、6-7 段
   考研一 Part A ≈400 词/篇（4 篇 1600 词）→ 计划 27-30 句 ≈ 400-520 词、7-8 段（练习留 5% 余量） */
const LEVELS = {
  cet4:{dmax:1, hard:false, simpleRatio:1,    tailP:0.15,
        paras:[['intro',3],['bg',2],['develop',4],['develop',3],['data',1],['debate',4],['data',1],['close',2]]},
  cet6:{dmax:2, hard:false, simpleRatio:0.75, tailP:0.3,
        paras:[['intro',3],['bg',3],['develop',4],['develop',3],['data',2],['develop',3],['debate',4],['data',1],['close',2]]},
  std: {dmax:2, hard:false, simpleRatio:0.6,  tailP:0.45,
        paras:[['intro',3],['bg',2],['develop',4],['develop',3],['data',2],['develop',3],['debate',4],['data',1],['debate',3],['close',2]]},
  plus:{dmax:2, hard:true,  simpleRatio:0.4,  tailP:0.45,
        paras:[['intro',3],['bg',2],['develop',5],['data',1],['develop',4],['data',1],['develop',3],['debate',5],['data',1],['debate',3],['close',2]]}
};
/* 按难度选句型：四级只用简单句(d=1)；六级简单句优先；强化难句优先 */
function pickTemplates(pool, n, cfg, used){
  /* 篇内去重：优先取本文未用过的模板，不够时才允许复用 */
  const fresh = used ? pool.filter(t=>!used.has(t)) : pool;
  const base = fresh.length >= n ? fresh : fresh.concat(pool.filter(t=>!fresh.includes(t)));
  let cands = base.filter(t=>t.d <= cfg.dmax);
  if(cands.length < n) cands = base.slice();
  if(cfg.hard) cands = cands.filter(t=>t.d===2).concat(cands.filter(t=>t.d!==2));
  const simple = shuffle(cands.filter(t=>t.d===1));
  const harder = shuffle(cands.filter(t=>t.d===2));
  const nSimple = Math.min(simple.length, Math.round(n * cfg.simpleRatio));
  const out = simple.slice(0, nSimple).concat(harder);
  for(const t of shuffle(cands)){
    if(out.length >= n) break;
    if(!out.includes(t)) out.push(t);
  }
  return out.slice(0, n);
}
function makeSentences(topic, role, n, cfg, dEn, dCn, used, usedTails){
  const pool = topic[role] || DATA_POOL;
  return pickTemplates(pool, n, cfg, used).map(t=>{
    if(used) used.add(t);
    const s = { en: fill(t.en, dEn), cn: fill(t.cn, dCn), g: t.g };
    return maybeExtend(s, cfg.tailP, usedTails);
  });
}

const DIFF_LABEL = { cet4:"四级阅读", cet6:"六级阅读", std:"考研标准", plus:"考研强化" };

/* 段落分块组装：数据块并入下一段落（末尾则并入上一段） */
function assembleParas(chunks, g){
  const groups=[]; let carry=[];
  chunks.forEach(([role,n])=>{
    if(role==='data'){ carry=carry.concat(g('data',n)); return; }
    groups.push(carry.concat(g(role,n))); carry=[];
  });
  if(carry.length && groups.length) groups[groups.length-1]=groups[groups.length-1].concat(carry);
  return groups.filter(gr=>gr.length);
}

function buildPassage(diff, planOverride){
  const seen = getSeen();
  let last=null;
  for(let attempt=0; attempt<16; attempt++){
    const topic = selTopics.length ? pick(selTopics.map(id=>TOPICS.find(t=>t.id===id))) : pick(TOPICS);
    const cfg = LEVELS[diff] || LEVELS.std;
    const e = makeEntities(topic);
    const {dEn,dCn} = buildDicts(e);
    const used=new Set(), usedTails=new Set();   /* 篇内模板/尾句去重 */
    const g = (role,n)=>makeSentences(topic,role,n,cfg,dEn,dCn,used,usedTails);
    /* 段落分块组装：数据句并入相邻段落，形成 6~8 个大段落 */
    const paras = assembleParas(planOverride || cfg.paras, g);

    // 故事题材：人物全名仅在首次出现，其后改用短名，更贴近真实行文
    if(topic.id==='story' && dEn.who && dEn.name){
      const flags={en:false,cn:false};
      const swapFirst=(txt,full,short,key)=>{
        let out=txt,pos;
        while((pos=out.indexOf(full))>=0){
          if(!flags[key]){ flags[key]=true; break; }
          out=out.slice(0,pos)+short+out.slice(pos+full.length);
        }
        return out;
      };
      paras.forEach(pa=>pa.forEach(s=>{
        s.en=swapFirst(s.en,dEn.who,dEn.name,'en');
        s.cn=swapFirst(s.cn,dCn.who,dCn.name,'cn');
      }));
    }

    // 全文主题短语去重：完整说法最多出现 2 次，其后改为 the issue / 该问题
    if(dEn.subject){
      let nEn=0, nCn=0;
      paras.forEach(pa=>pa.forEach(s=>{
        if(s.en.includes(dEn.subject)){
          const parts=s.en.split(dEn.subject);
          let rebuilt=parts[0];
          for(let k=1;k<parts.length;k++){ nEn++; rebuilt += (nEn>2?'the issue':dEn.subject) + parts[k]; }
          s.en=rebuilt;
        }
        if(s.cn.includes(dCn.subject)){
          const parts=s.cn.split(dCn.subject);
          let rebuilt=parts[0];
          for(let k=1;k<parts.length;k++){ nCn++; rebuilt += (nCn>2?'该问题':dCn.subject) + parts[k]; }
          s.cn=rebuilt;
        }
      }));
    }
    const titleTpl = pick(topic.titles);
    let titleEn, titleCn;
    try{ titleEn = fill(titleTpl.en,dEn); titleCn = fill(titleTpl.cn,dCn); }
    catch(err){ titleEn=titleTpl.en; titleCn=titleTpl.cn; }
    const p = { id: Date.now().toString(36)+Math.random().toString(36).slice(2,7),
                topicId:topic.id, topicName:topic.name, emoji:topic.emoji, diff,
                titleEn, titleCn, paras };
    p.wordCount = p.paras.flat().reduce((n,s)=>n + s.en.trim().split(/\s+/).length, 0);
    p.subjectEn = dEn.subject || '';   /* 主旨题正确项：本文主题短语 */
    last = p;
    const sig = seenHash(p.paras.flat().map(s=>s.en).join('~'));
    if(!seen.includes(sig)){ pushSeen(sig); return p; }
  }
  return last; // 撞重概率极低；兜底返回
}

/* ---------- 已读指纹（避免重复） ---------- */
/* 存短哈希而非全文指纹：60 篇全文 ≈150KB，哈希后仅几十字节 */
function seenHash(sig){
  let h=5381;
  for(let i=0;i<sig.length;i++){ h=((h<<5)+h+sig.charCodeAt(i))|0; }
  return 'h'+(h>>>0).toString(36)+'.'+sig.length.toString(36);
}
function getSeen(){ try{ return JSON.parse(localStorage.getItem('yt_seen')||'[]'); }catch(e){ return []; } }
function pushSeen(sig){
  let seen=getSeen(); seen.push(sig);
  if(seen.length>60) seen=seen.slice(-60);
  try{ localStorage.setItem('yt_seen', JSON.stringify(seen)); }catch(e){}
}

/* ---------- 重点词汇匹配 ---------- */
function matchVocab(paras){
  const text = paras.flat().map(s=>s.en).join(' ');
  const out=[];
  for(const w in GLOSSARY){
    let hit=false;
    if(w.includes(' ')){ hit = text.toLowerCase().includes(w); }
    else{
      const re=new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
      hit=re.test(text);
    }
    if(hit) out.push({w,cn:GLOSSARY[w]});
  }
  return out;
}

/* ---------- 启动自检（模板槽位校验） ---------- */
function validateAll(){
  let bad=0;
  for(const t of TOPICS){
    let e;
    try{ e=makeEntities(t); }catch(err){ console.warn('[自检] 实体生成失败', t.id, err); bad++; continue; }
    const {dEn,dCn}=buildDicts(e);
    for(const role of ['intro','bg','develop','data','debate','close']){
      (t[role]||[]).forEach((tpl,i)=>{
        for(const [k,txt] of [['en',tpl.en],['cn',tpl.cn]]){
          const slots = txt.match(/\{(\w+)\}/g)||[];
          for(const s of slots){
            const key=s.slice(1,-1);
            const d = k==='en'?dEn:dCn;
            if(!(key in d)){ console.warn(`[自检] ${t.id}.${role}[${i}] ${k} 缺槽位 {${key}}`); bad++; }
          }
        }
      });
    }
  }
  if(bad===0) console.log('[自检] 全部模板槽位校验通过 ✔');
  return bad;
}

/* =====================================================
   UI
===================================================== */
let selTopics=[];          // 空数组=全部随机
let curDiff='std';
let curMode='en';
let curPassage=null;
let readerFrom='home';     // 阅读页返回目标：home 或 profile

const SETTINGS_KEY='yt_settings';
function aiCfgFill(){
  const c=aiCfg();
  document.getElementById('aiUrl').value=c.url||'';
  document.getElementById('aiModel').value=c.model||'';
  document.getElementById('aiKey').value=c.key||'';
}
$('#aiSave').onclick=function(){
  aiCfgSave({url:document.getElementById('aiUrl').value.trim(),
             model:document.getElementById('aiModel').value.trim(),
             key:document.getElementById('aiKey').value.trim(),
             ollamaModel:(aiCfg().ollamaModel||'qwen2.5:7b')});
  spkOllamaOK=null;
  const m=document.getElementById('aiCfgMsg'); m.textContent='✅ 已保存'; m.style.color='#2e9e5b';
};
$('#aiTest').onclick=async function(){
  const m=document.getElementById('aiCfgMsg');
  aiCfgSave({url:document.getElementById('aiUrl').value.trim(),
             model:document.getElementById('aiModel').value.trim(),
             key:document.getElementById('aiKey').value.trim(),
             ollamaModel:(aiCfg().ollamaModel||'qwen2.5:7b')});
  spkOllamaOK=null; m.textContent='测试中…'; m.style.color='var(--muted)';
  const t=await aiChat('测试：请回复 OK','只回复两个字母：OK',60000,1);
  if(t){ m.textContent='✅ 连通成功：'+t.trim().slice(0,30); m.style.color='#2e9e5b'; }
  else{ m.textContent='❌ 未连通（检查地址/Key/网络）；不影响本地生成'; m.style.color='#d9534f'; }
};
Array.prototype.forEach.call(document.querySelectorAll('.aiPreset'), function(b){
  b.addEventListener('click', function(){
    document.getElementById('aiUrl').value = b.dataset.u;
    document.getElementById('aiModel').value = b.dataset.m;
    const m=document.getElementById('aiCfgMsg');
    m.innerHTML='已填入 <b>'+b.textContent+'</b> — 请注册并粘贴该服务的 API Key，然后点「测试连通」';
    m.style.color='var(--muted)';
  });
});
const wbPresetBtn=document.getElementById('wbPreset');
if(wbPresetBtn) wbPresetBtn.onclick=function(){
  aiCfgSave({});
  document.getElementById('aiUrl').value='';
  document.getElementById('aiModel').value='';
  document.getElementById('aiKey').value='';
  const m=document.getElementById('aiCfgMsg');
  m.innerHTML='已切换为 <b>WorkBuddy 云端 AI</b>（免 Key，最高优先级）— 点「测试连通」可验证';
  m.style.color='var(--muted)';
};
$('#aiSeg').addEventListener('click', function(e){
  const b=e.target.closest('button'); if(!b) return;
  AI_MODE=(b.dataset.v==='ai');
  Array.prototype.forEach.call(document.getElementById('aiSeg').children,function(x){ x.classList.toggle('on', x===b); });
  saveSettings();
  showToast(AI_MODE?'已切换：AI 联网生成（无网络时自动回落本地）':'已切换：本地离线生成');
});
$('#aiCancel').onclick=function(){
  AI_CANCEL=true;
  if(AI_CTRL){ try{ AI_CTRL.abort(); }catch(e){} }   /* 随时中断进行中的请求 */
};
function loadSettings(){
  try{
    const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
    if(Array.isArray(s.topics)) selTopics=s.topics;
    if(s.diff) curDiff=s.diff;
    if(s.mode) curMode=s.mode;
    if(typeof s.aiMode!=='undefined') AI_MODE=!!s.aiMode;
    if(s.theme) document.documentElement.dataset.theme=s.theme;
    if(s.fs){ document.documentElement.style.setProperty('--fs', s.fs+'px'); fsIdx=FS_STEPS.indexOf(s.fs); if(fsIdx<0)fsIdx=0; }
  }catch(e){}
}
function saveSettings(){
  try{
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      topics:selTopics, diff:curDiff, mode:curMode, aiMode:AI_MODE,
      theme:document.documentElement.dataset.theme||'',
      fs:FS_STEPS[fsIdx]
    }));
  }catch(e){}
}

/* 首页：题材 chips */
function renderTopicChips(){
  const box=$('#topicChips'); box.innerHTML='';
  TOPICS.forEach(t=>{
    const b=document.createElement('button');
    b.className='chipBtn'+(selTopics.includes(t.id)?' on':'');
    b.textContent=t.emoji+' '+t.name;
    b.onclick=()=>{
      const i=selTopics.indexOf(t.id);
      if(i>=0) selTopics.splice(i,1); else selTopics.push(t.id);
      renderTopicChips(); saveSettings();
    };
    box.appendChild(b);
  });
  const all=document.createElement('button');
  all.className='chipBtn'+(selTopics.length?'':' on');
  all.textContent='🎲 全部随机';
  all.onclick=()=>{ selTopics=[]; renderTopicChips(); saveSettings(); };
  box.appendChild(all);
}

/* 首页：难度 */
$('#diffSeg').addEventListener('click', ev=>{
  const b=ev.target.closest('button'); if(!b) return;
  curDiff=b.dataset.v;
  [...$('#diffSeg').children].forEach(x=>x.classList.toggle('on', x===b));
  saveSettings();
});

/* 渲染阅读页 */
function renderPassage(p){
  stopTts();
  curPassage=p;
  $('#metaChips').innerHTML =
    `<span>${gmEsc(p.emoji+' '+p.topicName)}</span><span>${DIFF_LABEL[p.diff]}</span><span>约 ${p.wordCount} 词</span><span>${p.source==='ai'?'🌐 AI 生成':'📦 本地引擎'}</span>`;
  $('#titleEn').textContent = p.titleEn;
  $('#titleCn').textContent = p.titleCn;
  const art=$('#article'); art.innerHTML='';
  p.paras.forEach(para=>{
    const sec=document.createElement('section'); sec.className='para';
    para.forEach(s=>{
      const div=document.createElement('div'); div.className='sent';
      div.innerHTML =
        `<p class="en">${gmEsc(s.en)}</p>`+
        `<div class="cnwrap"><p class="cn">${gmEsc(s.cn)}</p>${s.g?`<span class="gtag">${gmEsc(s.g)}</span>`:''}</div>`;
      sec.appendChild(div);
    });
    art.appendChild(sec);
  });
  const vocab=matchVocab(p.paras);
  (p.extraWords||[]).forEach(function(w){ if(!vocab.some(function(v){ return v.w.toLowerCase()===w.w.toLowerCase(); })) vocab.push(w); });
  $('#vocabCount').textContent = vocab.length?`（${vocab.length} 个）`:'';
  $('#vocabList').innerHTML = vocab.map(v=>`<li><b>${gmEsc(v.w)}</b><span>${gmEsc(v.cn)}</span></li>`).join('');
  $('#vocabBox').open=false;
  applyMode();
  updateFavBtn();
  try{ sessionStorage.setItem('yt_cur', JSON.stringify(p)); }catch(e){}
  window.scrollTo(0,0);
}

function applyMode(){
  document.body.classList.toggle('mode-cn', curMode==='cn');
  [...$('#modeSeg').children].forEach(b=>b.classList.toggle('on', b.dataset.v===curMode));
}
$('#modeSeg').addEventListener('click', ev=>{
  const b=ev.target.closest('button'); if(!b) return;
  curMode=b.dataset.v; applyMode(); saveSettings();
});

/* 视图切换 */
/* ---------- AI 联网生成（多端点轮询，失败自动回落本地） ---------- */
function aiLoadingShow(kind){
  AI_CANCEL=false; AI_CTRL=null; AI_T0=Date.now();
  const el=document.getElementById('aiLoad');
  if(el){
    const card=el.querySelector('.aiCard');
    if(card) card.style.borderColor='';
    const k=document.getElementById('aiKind');
    k.textContent=kind; k.style.color='';
    const sp=el.querySelector('.spin'); if(sp) sp.style.display='block';
    const s2=document.getElementById('aiSec'); if(s2) s2.style.display='';
    const cb=el.querySelector('.aiCard button'); if(cb) cb.style.display='';
    el.style.display='flex';
  }
  if(!AI_TMR) AI_TMR=setInterval(function(){
    const s=document.getElementById('aiSec');
    if(s&&AI_BUSY) s.textContent=Math.round((Date.now()-AI_T0)/1000)+'s';
  },500);
}
function aiLoadingDone(ok,note){
  if(AI_TMR){ clearInterval(AI_TMR); AI_TMR=null; }
  const el=document.getElementById('aiLoad'); if(!el) return;
  const card=el.querySelector('.aiCard');
  const k=document.getElementById('aiKind');
  if(card) card.style.borderColor= ok? '#2e9e5b' : '#d9534f';
  k.textContent= ok? '✅ AI 生成成功' : '❌ AI 生成失败'+(note?'（'+note+'）':'');
  k.style.color= ok? '#2e9e5b' : '#d9534f';
  const sp=el.querySelector('.spin'); if(sp) sp.style.display='none';
  const s2=document.getElementById('aiSec'); if(s2) s2.style.display='none';
  const cb=el.querySelector('.aiCard button'); if(cb) cb.style.display='none';
}
function aiLoadingWait(ms){ return new Promise(function(res){ setTimeout(res,ms); }); }
function aiLoadingHide(){
  const el=document.getElementById('aiLoad'); if(el) el.style.display='none';
  if(AI_TMR){ clearInterval(AI_TMR); AI_TMR=null; }
  AI_BUSY=false;
}
var AI_MODE=true, AI_BUSY=false, AI_CANCEL=false, AI_CTRL=null, AI_TMR=null, AI_T0=0;
function aiCfg(){ try{ return JSON.parse(localStorage.getItem('yt_aicfg')||'{}'); }catch(e){ return {}; } }
function aiCfgSave(c){ try{ localStorage.setItem('yt_aicfg', JSON.stringify(c)); }catch(e){} }
/* 免费无密钥兜底通道（对方接口策略可能变化，失败自动跳过） */
const AI_FREE=[
  {url:'https://text.pollinations.ai/openai', model:'openai', key:''}
];
/* ---------- WorkBuddy 云端 AI（免密钥，最高优先级） ---------- */
var WB_CLOUD=null, WB_MODELS=null;
try{
  if(window.WorkBuddyCloud){
    WB_CLOUD=WorkBuddyCloud.createWorkBuddyCloud({
      endpoint:'https://kaoyan-reading-65228.app.workbuddy.host',
      publishableKey:'wbpk_xBdw1VVfFNuWiHiVJgnZPy_EY32VZ53l9ecPE5JwddrM6FHqeySawSU'
    });
  }
}catch(e){ WB_CLOUD=null; }
async function wbCloudChat(msgs,timeoutMs){
  if(!WB_CLOUD) return null;
  try{
    if(!WB_MODELS){
      WB_MODELS=await WB_CLOUD.llm.models.list();
      if(!Array.isArray(WB_MODELS)) WB_MODELS=[];
    }
    const model=WB_MODELS.find(function(m){ return m&&m.disabled!==true; });
    if(!model) return null;
    /* 接口要求第一条必须是 system 消息 */
    const outMsgs=(msgs[0]&&msgs[0].role==='system')?msgs
      :[{role:'system',content:'You are a helpful assistant. Be concise and helpful.'}].concat(msgs);
    const ctrl=new AbortController();
    AI_CTRL=ctrl;   /* 接入全局取消：生成中点「取消」立即中断云端流式输出 */
    const tm=setTimeout(function(){ ctrl.abort(); }, timeoutMs||60000);
    let txt='';
    for await (const chunk of WB_CLOUD.llm.chat.completions.create({
      model:model.id, messages:outMsgs, stream:true, temperature:0.95, signal:ctrl.signal
    })){
      if(AI_CANCEL){ clearTimeout(tm); AI_CTRL=null; try{ctrl.abort();}catch(e){} return null; }
      const d=chunk.choices&&chunk.choices[0]&&chunk.choices[0].delta;
      if(d&&d.content) txt+=d.content;
    }
    clearTimeout(tm); AI_CTRL=null;
    return txt;
  }catch(e){ AI_CTRL=null; return null; }
}
async function aiChat(sys,usr,timeoutMs,minLen){
  AI_CANCEL=false;   /* 复位取消标记（上次任务取消后不污染本次，「测试连通」不再永久失败） */
  const msgs=[{role:'system',content:sys},{role:'user',content:usr}];
  const cfg=aiCfg();
  /* ① WorkBuddy 云端 AI：免密钥，优先使用 */
  try{
    const wbTxt=await wbCloudChat(msgs,timeoutMs);
    if(AI_CANCEL) return null;
    if(wbTxt&&wbTxt.trim().length>(minLen||80)) return wbTxt;
  }catch(e){ if(AI_CANCEL) return null; }
  await ollamaProbe();
  /* 端点优先级：用户自定义 → Ollama 本地（探测可达才用） → 免费无密钥兜底 */
  const eps=[];
  if(cfg.url) eps.push({url:cfg.url, model:cfg.model||'gpt-4o-mini', key:cfg.key||''});
  if(spkOllamaOK) eps.push({url:'http://localhost:11434/v1/chat/completions', model:cfg.ollamaModel||'qwen2.5:7b', key:''});
  AI_FREE.forEach(function(ep){ eps.push({url:ep.url, model:ep.model, key:ep.key}); });
  for(const ep of eps){
    try{
      const ctrl=new AbortController();
      AI_CTRL=ctrl;
      const tm=setTimeout(function(){ ctrl.abort(); }, timeoutMs||60000);
      let res,txt='';
      const headers={'Content-Type':'application/json'};
      if(ep.key) headers['Authorization']='Bearer '+ep.key;
      res=await fetch(ep.url,{method:'POST',signal:ctrl.signal,headers:headers,
        body:JSON.stringify({model:ep.model,messages:msgs,temperature:0.95})});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const j=await res.json();
      txt=(j.choices&&j.choices[0]&&j.choices[0].message)? j.choices[0].message.content : (j.content||'');
      clearTimeout(tm);
      if(AI_CANCEL) return null;
      if(txt&&txt.trim().length>(minLen||80)) return txt;
    }catch(e){ if(AI_CANCEL) return null; }
  }
  return null;
}
let spkOllamaOK=null;
async function ollamaProbe(){
  if(spkOllamaOK!==null) return spkOllamaOK;
  try{
    const ctrl=new AbortController();
    setTimeout(function(){ ctrl.abort(); },3000);   /* 3 秒强超时，防连接黑洞挂起 */
    const r=await fetch('http://localhost:11434/api/tags',{signal:ctrl.signal});
    spkOllamaOK=r.ok;
  }catch(e){ spkOllamaOK=false; }
  return spkOllamaOK;
}
function aiHist(kind){ try{ return JSON.parse(localStorage.getItem('yt_ai_'+kind)||'[]'); }catch(e){ return []; } }
function aiHistPush(kind,v){ var a=aiHist(kind); a.push(v); if(a.length>8) a=a.slice(-8); try{ localStorage.setItem('yt_ai_'+kind, JSON.stringify(a)); }catch(e){} }
function extractJSON(txt){
  if(!txt) return null;
  const a=txt.indexOf('{'), b=txt.lastIndexOf('}');
  if(a<0||b<=a) return null;
  try{ return JSON.parse(txt.slice(a,b+1)); }catch(e){ return null; }
}
async function aiBuildReading(){
  const avoid=aiHist('read');
  /* 容量+难度双硬标准（对齐近几年真题并留余量；词汇难度必须匹配所选考试层级）：
     四级 380+ 词 6 段+（四级词汇）、六级 460+ 词 7 段+（六级词汇）、
     考研标准 560+ 词 8 段+（考研词汇）、考研强化 620+ 词 8 段+。
     AI 产出不足即重试，仍不足则回落本地引擎（本地永远达标）。 */
  const diffNow=(typeof curDiff!=='undefined'&&curDiff)?curDiff:'std';
  /* 对齐官方大纲（2026-11-15 校准）：
     四级仔细阅读 300-350 词/篇（cet.neea.edu.cn 大纲）→ AI 目标 320-360 词、5-6 段
     六级仔细阅读 400-450 词/篇 → AI 目标 420-460 词、6-7 段
     考研一 Part A ≈400 词/篇（4 篇 1600 词，研招网）→ AI 目标 400-480 词、6-8 段
     考研强化：练习留 10% 余量 → 440-520 词、7-8 段 */
  const SPEC={
    cet4:{minW:320, minP:5, pTxt:'5-6个自然段', wTxt:'320-360词',
          lvl:'大学英语四级（CET-4）难度：词汇控制在四级大纲（约4500词）范围内，以常用词和常见搭配为主，句式以简单句、并列句和常见从句为主，不使用生僻学术词'},
    cet6:{minW:420, minP:6, pTxt:'6-7个自然段', wTxt:'420-460词',
          lvl:'大学英语六级（CET-6）难度：使用六级核心词汇（约6000词范围）与常见学术表达，长难句适度（1-2重从句）'},
    std: {minW:400, minP:6, pTxt:'6-8个自然段', wTxt:'400-480词',
          lvl:'考研英语（一）难度：大纲5500词范围内的学术词汇，多重从句嵌套的长难句，分词结构、插入语、倒装等考研典型句式'},
    plus:{minW:440, minP:7, pTxt:'7-8个自然段', wTxt:'440-520词',
          lvl:'考研强化难度：更高密度的长难句、低频学术词与抽象概念，句式转换灵活隐晦'}
  }[diffNow]||{minW:400, minP:6, pTxt:'6-8个自然段', wTxt:'400-480词', lvl:'考研英语（一）难度：学术词汇丰富，长难句'};
  const MINW=SPEC.minW, MINP=SPEC.minP;
  const sys='你是考研英语命题专家。只输出严格JSON对象，禁止输出任何解释、前言或markdown代码块标记。';
  const base='随机生成一篇考研英语阅读理解文章并配套命题。要求：主题随机（科技/生态/社会/心理/经济/教育/医疗等），'+SPEC.pTxt+'，全文'+SPEC.wTxt+'（硬性标准：段数少于'+MINP+'段或总词数低于'+MINW+'词视为无效输出，将被判不合格；每段至少4-6句、每句15-30词，篇幅宁多勿少）；词汇与句式难度：'+SPEC.lvl+'（词汇难度必须与考试层级严格匹配，不得超纲或降级）；每段给准确中文翻译；另从文中选10-14个与该难度匹配的高频词给中文释义。'+
    '命题要求：根据文章内容出5道阅读理解选择题，题型覆盖 1道主旨大意题 + 2道细节理解题 + 1道推理判断题 + 1道词义猜测题；题干和四个选项全部用英文，选项有干扰性但只有一个正确答案，答案必须能从文章中找到依据；每题给中文解析（说明定位依据与排除理由）。';
  const tail='输出JSON格式：{"title":"英文标题","titleCn":"中文标题","paras":[{"sents":[{"en":"英文句","cn":"中文句"},中间若干句]}],"words":[{"w":"单词","cn":"词性. 释义"}],"qs":[{"kind":"题型（主旨大意/细节理解/推理判断/词义猜测/作者态度）","stem":"英文题干","opts":["四个英文选项"],"ans":0到3的正确选项下标,"why":"中文解析"} 共5题]}。'+
    (avoid.length?'本次主题与标题必须与已生成列表完全不同：'+avoid.join(' / ')+'。':'');
  for(let attempt=0; attempt<2; attempt++){
    const usr=base+(attempt===1?' 再次强调：必须至少'+MINP+'个自然段、全文'+MINW+'词以上，不许偷工减料，篇幅宁可偏长也不要只写几段。':'')+tail;
    const txt=await aiChat(sys,usr,180000);
    if(!txt) continue;
    const j=extractJSON(txt); if(!j) continue;
    const paras=(j.paras||[]).map(function(p){
      return (p.sents||[]).filter(function(s){ return s&&s.en; }).map(function(s){
        return {en:String(s.en).trim(), cn:String(s.cn||'').trim(), g:''};
      });
    }).filter(function(a){ return a.length>=3 && a.every(function(s){ return s.en.length>=25 && s.cn; }); });
    if(!j.title || paras.length<MINP) continue;
    var wc=0; paras.forEach(function(pa){ pa.forEach(function(s){ wc+=s.en.trim().split(/\s+/).length; }); });
    if(wc<MINW) continue;   /* 段数或字数不达标：重试一次，仍不足则返回 null 走本地引擎 */
    const words=(j.words||[]).filter(function(w){ return w&&w.w; }).slice(0,14)
      .map(function(w){ return {w:String(w.w), cn:String(w.cn||'')}; });
    /* AI 命题的阅读理解题：校验结构（题干 + 4 选项 + 合法答案下标），不足 4 题则不附带 */
    const qs=(j.qs||[]).filter(function(q){
      return q && q.stem && q.opts && q.opts.length===4 &&
             q.opts.every(function(o){ return o && String(o).trim(); }) &&
             typeof q.ans==='number' && q.ans>=0 && q.ans<4;
    }).slice(0,5).map(function(q){
      return {kind:String(q.kind||'阅读'), stem:String(q.stem).trim(),
              opts:q.opts.map(function(o){ return String(o).trim(); }), ans:q.ans, why:String(q.why||'')};
    });
    return {titleEn:String(j.title||'AI Reading'), titleCn:String(j.titleCn||''),
            paras:paras, words:words, qs:(qs.length>=4?qs:[]), src:'ai'};
  }
  return null;
}
async function aiBuildCloze(){
  const avoid=aiHist('cloze');
  /* 真题标准（官方大纲）：四级选词填空 200-250 词、六级 250-300 词、10 空。
     分档下限：四级 200 / 六级 250 / 考研 240；词汇难度匹配层级，不足即重试/回落本地。 */
  const lvNow=(typeof clozeLevel!=='undefined'&&clozeLevel)?clozeLevel:'cet4';
  const CLOZE_SPEC={
    cet4:{minW:200, wTxt:'200-250词', lvl:'大学英语四级（CET-4）难度：词汇限于四级大纲（约4500词）范围，句式平实'},
    cet6:{minW:250, wTxt:'250-300词', lvl:'大学英语六级（CET-6）难度：六级核心词汇（约6000词范围）、常见学术表达'},
    kao: {minW:240, wTxt:'240-290词', lvl:'考研难度：大纲5500词范围内的学术词汇、多重从句嵌套的长难句'}
  }[lvNow]||{minW:200, wTxt:'200-250词', lvl:'大学英语四级难度'};
  const MINW=CLOZE_SPEC.minW;
  const sys='你是大学英语四六级与考研命题专家。只输出严格JSON对象，禁止输出任何解释或markdown代码块标记。';
  const base='随机生成一篇"15选10"选词填空题：随机主题短文（科技/社会/生态/经济/教育/健康等），4-6个自然段，全文'+CLOZE_SPEC.wTxt+'（硬性标准：短文低于'+MINW+'词视为无效输出，将被判不合格；每段至少3句）；词汇与句式难度：'+CLOZE_SPEC.lvl+'（与考试层级严格匹配）；文中按出现顺序挖10个空，用 __1__ 到 __10__ 标注；挖出的都是实词（名词/动词/形容词/副词），原词填回不需要变形；另给15个选项（10个正确答案+5个干扰项），每个给词性和中文释义，干扰项与正确词词性相近。';
  const tail='输出JSON格式：{"title":"英文标题","titleCn":"中文标题","paras":[{"en":"含 __1__ 等空标记的英文段落","cn":"该段中文翻译"}],"options":[{"w":"单词(与文中形式完全一致)","pos":"n.","cn":"释义"} 共15个],"answers":["第1空正确单词",共10个按顺序]}。'+
    (avoid.length?'本次主题与标题必须与已生成列表完全不同：'+avoid.join(' / ')+'。':'');
  for(let attempt=0; attempt<2; attempt++){
    const usr=base+(attempt===1?' 再次强调：短文必须达到'+MINW+'词以上，不许只写一段或几句话。':'')+tail;
    const txt=await aiChat(sys,usr,180000);
    if(!txt) continue;
    const j=extractJSON(txt); if(!j) continue;
    const opts=(j.options||[]).filter(function(o){ return o&&o.w&&o.cn; }).slice(0,15)
      .map(function(o,i){ return {w:String(o.w).trim(), pos:String(o.pos||'').trim(), cn:String(o.cn||'').trim(), letter:'ABCDEFGHIJKLMNO'[i]}; })
      .filter(function(o){ return o.w.length>=2 && o.cn; });
    const answers=(j.answers||[]).map(function(x){ return String(x).trim().toLowerCase(); }).slice(0,10);
    /* 校验：每个答案都必须存在于选项表，否则该空永远填不出（AI 幻觉防护） */
    const optWs={}; opts.forEach(function(o){ optWs[o.w.toLowerCase()]=1; });
    const validAnswers=answers.filter(function(w){ return optWs[w]; });
    const paras=(j.paras||[]).filter(function(p){ return p&&p.en&&p.en.length>=120; }).map(function(p){ return {en:String(p.en), cn:String(p.cn||'')}; });
    if(opts.length<15 || validAnswers.length!==10 || !paras.length) continue;
    var wc=0; paras.forEach(function(p){ wc+=p.en.replace(/__\d+__/g,' ').trim().split(/\s+/).filter(Boolean).length; });
    if(wc<MINW) continue;   /* 短文长度不达真题标准：重试一次，仍不足则回落本地引擎 */
    return {titleEn:String(j.title||'AI Cloze'), titleCn:String(j.titleCn||''),
            paras:paras, options:opts, answers:validAnswers, src:'ai'};
  }
  return null;
}
async function aiBuildDialog(){
  const avoid=aiHist('talk');
  const sys='你是英语口语对话编写专家。只输出严格JSON对象，禁止输出任何解释或markdown代码块标记。';
  const usr='随机生成一段两人英语日常对话：场景随机（餐厅点餐/酒店入住/网购客服/租房子/工作面试/健身房/旅行计划/演唱会等），12-16句，每句8-14词，总词数≥180，口语自然地道，逐句中文翻译，两位说话人用中文角色名。'+
    '输出JSON格式：{"scene":"场景中文名（如 餐厅点餐）","lines":[{"who":"角色中文名","en":"英文句","cn":"中文句"}]}。'+
    (avoid.length?'本次场景与内容必须与已生成列表完全不同：'+avoid.join(' / ')+'。':'');
  const txt=await aiChat(sys,usr,150000);
  if(!txt) return null;
  const j=extractJSON(txt); if(!j) return null;
  const lines=(j.lines||[]).filter(function(L){ return L&&L.en&&L.cn; }).map(function(L){
    return {who:String(L.who||'A'), en:String(L.en).trim(), cn:String(L.cn||'').trim()};
  });
  let words=0; lines.forEach(function(L){ words+=normWords(L.en).length; });
  if(lines.length<10 || words<140) return null;
  return {icon:'🤖', name:String(j.scene||'AI 对话'), lines:lines, src:'ai'};
}
function showOnly(id){ ['home','reader','profile','words','quiz','cloze','speak','longread','games','writing','mock','trans'].forEach(s=>{ $('#'+s).style.display = (s===id)?'block':'none'; }); }
function showReader(){ showOnly('reader'); }
function showHome(){ stopTts(); showOnly('home'); updateMeBtn(); window.scrollTo(0,0); }
function showProfile(){ stopTts(); showOnly('profile'); renderProfile(); window.scrollTo(0,0); }

/* ---------- 收藏 ---------- */
function getFavs(){ try{ return JSON.parse(localStorage.getItem('yt_favs')||'[]'); }catch(e){ return []; } }
function saveFavs(l){ try{ localStorage.setItem('yt_favs', JSON.stringify(l)); }catch(e){ showToast('⚠️ 保存失败：浏览器存储空间不足，收藏未更新'); } }
function updateFavBtn(){
  const on = !!(curPassage && curPassage.id && getFavs().some(f=>f.id===curPassage.id));
  const b=$('#favBtn');
  b.textContent = on?'★':'☆';
  b.classList.toggle('on', on);
}
$('#favBtn').onclick=()=>{
  if(!curPassage) return;
  const favs=getFavs();
  const i=favs.findIndex(f=>f.id===curPassage.id);
  if(i>=0){
    favs.splice(i,1); saveFavs(favs);
    updateFavBtn(); updateMeBtn(); showToast('已取消收藏');
  }else{
    if(favs.length>=200){ showToast('收藏已达上限 200 篇，请先在「我的主页」清理'); return; }
    favs.push(Object.assign({}, curPassage, {savedAt:Date.now()}));
    saveFavs(favs);
    updateFavBtn(); updateMeBtn(); showToast('已收藏 ⭐ 可在「我的主页」回看');
  }
};

/* ---------- 统计 ---------- */
function getStats(){ try{ return JSON.parse(localStorage.getItem('yt_stats')||'{"read":0,"words":0}'); }catch(e){ return {read:0,words:0}; } }
function bumpStats(words){
  const s=getStats(); s.read=(s.read||0)+1; s.words=(s.words||0)+(words||0);
  /* 连续学习打卡：跨天断签归零 */
  const ds=function(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const today=ds(new Date());
  const yesterday=ds(new Date(Date.now()-86400000));
  if(s.lastDay!==today){
    s.streak=(s.lastDay===yesterday)?(s.streak||0)+1:1;
    s.lastDay=today;
  }
  /* 逐日记录（学习面板热力日历数据源），上限 400 天 */
  s.daily=s.daily||{};
  const d0=s.daily[today]||{read:0,words:0};
  d0.read=(d0.read||0)+1; d0.words=(d0.words||0)+(words||0);
  s.daily[today]=d0;
  const dayKeys=Object.keys(s.daily);
  if(dayKeys.length>400){ dayKeys.sort(); dayKeys.slice(0,dayKeys.length-400).forEach(function(k){ delete s.daily[k]; }); }
  try{ localStorage.setItem('yt_stats', JSON.stringify(s)); }catch(e){}
}
function renderStreakChip(){
  const el=document.getElementById('streakChip'); if(!el) return;
  const s=getStats();
  const n=Math.max(1, s.streak||0);
  el.textContent = '🔥 连续学习 '+n+' 天';
}

/* ---------- 我的主页 ---------- */
function updateMeBtn(){ $('#meBtn').textContent='⭐ 我的主页'; }
function renderProfile(){
  const favs=getFavs(), st=getStats();
  $('#stRead').textContent=st.read||0;
  $('#stFav').textContent=favs.length;
  $('#stWords').textContent=(st.words||0).toLocaleString('en-US');
  const list=$('#favList'); list.innerHTML='';
  $('#favEmpty').style.display = favs.length?'none':'block';
  favs.slice().sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).forEach(f=>{
    const card=document.createElement('div'); card.className='favCard';
    const d=new Date(f.savedAt||Date.now());
    const ds=(d.getMonth()+1)+'月'+d.getDate()+'日';
    card.innerHTML =
      `<div class="favMain">
        <div class="favTitle">${gmEsc(f.titleEn)}</div>
        <div class="favCn">${gmEsc(f.titleCn||'')}</div>
        <div class="favMeta"><span>${gmEsc((f.emoji||'')+' '+(f.topicName||''))}</span><span>${DIFF_LABEL[f.diff]||''}</span><span>约 ${f.wordCount} 词</span><span>${ds}</span></div>
      </div>
      <button class="favStar" title="取消收藏">★</button>`;
    card.querySelector('.favStar').onclick=(ev)=>{ ev.stopPropagation(); removeFav(f.id); };
    card.querySelector('.favMain').onclick=()=>openFav(f);
    list.appendChild(card);
  });
  renderHistory();
  renderWrong();
  renderPanel();
  updateMeBtn();
}
function removeFav(id){
  saveFavs(getFavs().filter(f=>f.id!==id));
  renderProfile(); updateFavBtn(); showToast('已取消收藏');
}
function openFav(f){
  readerFrom='profile';
  curPassage=f;
  recordHistory(f);
  renderPassage(f);
  showReader();
  setHash('#read');
}

/* ---------- 浏览历史 ---------- */
function getHistory(){ try{ return JSON.parse(localStorage.getItem('yt_history')||'[]'); }catch(e){ return []; } }
function saveHistory(h){ try{ localStorage.setItem('yt_history', JSON.stringify(h)); }catch(e){} }
function recordHistory(p){
  if(!p || !p.id || !p.titleEn) return;
  let h = getHistory().filter(x=>x.id!==p.id);   // 同一篇只保留最新时间
  h.unshift(Object.assign({}, p, {t:Date.now()}));
  if(h.length>50) h=h.slice(0,50);
  saveHistory(h);
}
function removeHistory(id){
  saveHistory(getHistory().filter(x=>x.id!==id));
  renderProfile(); showToast('已删除该条记录');
}
function clearHistory(){
  if(!getHistory().length) return;
  if(confirm('确定清空全部浏览记录吗？')){
    saveHistory([]); renderProfile(); showToast('浏览记录已清空');
  }
}
function renderHistory(){
  const hist=getHistory();
  $('#histEmpty').style.display = hist.length?'none':'block';
  const hl=$('#histList'); hl.innerHTML='';
  hist.forEach(f=>{
    const d=new Date(f.t||Date.now());
    const ds=(d.getMonth()+1)+'月'+d.getDate()+'日 '
            + String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    const card=document.createElement('div'); card.className='favCard';
    card.innerHTML =
      `<div class="favMain">
        <div class="favTitle">${gmEsc(f.titleEn)}</div>
        <div class="favMeta"><span>🕐 ${ds}</span><span>${gmEsc((f.emoji||'')+' '+(f.topicName||''))}</span><span>${DIFF_LABEL[f.diff]||''}</span><span>约 ${f.wordCount} 词</span></div>
      </div>
      <button class="histDel" title="删除这条记录">✕</button>`;
    card.querySelector('.histDel').onclick=(ev)=>{ ev.stopPropagation(); removeHistory(f.id); };
    card.querySelector('.favMain').onclick=()=>openFav(f);
    hl.appendChild(card);
  });
}
$('#clearHist').onclick=clearHistory;

/* ---------- 阅读测试 + 错题本 ---------- */
function getWrongBook(){ try{ return JSON.parse(localStorage.getItem('yt_wrongbook')||'[]'); }catch(e){ return []; } }
function saveWrongBook(w){ try{ localStorage.setItem('yt_wrongbook', JSON.stringify(w)); }catch(e){} }
function addWrong(q){
  let wb=getWrongBook().filter(x=>!(x.type===q.type && x.body===q.body));  // 同题去重
  wb.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),
    type:q.type, prompt:q.prompt, body:q.body, correct:q.correct||q.options[q.ans], your:q.your, yourIdx:q.yourIdx,
    options:q.options||[],       /* 记录完整选项，错题重刷需要 */
    title:(curPassage&&curPassage.titleEn)?curPassage.titleEn:(q.title||''), t:Date.now()});
  if(wb.length>100) wb=wb.slice(0,100);
  saveWrongBook(wb);
}
function removeWrong(id){
  saveWrongBook(getWrongBook().filter(x=>x.id!==id));
  renderProfile(); showToast('已从错题本删除');
}
$('#clearWrong').onclick=()=>{
  if(!getWrongBook().length) return;
  if(confirm('确定清空错题本吗？')){ saveWrongBook([]); renderProfile(); showToast('错题本已清空'); }
};
function renderWrong(){
  const wb=getWrongBook();
  $('#wrongCount').textContent = wb.length?`（${wb.length} 题）`:'';
  $('#wrongEmpty').style.display = wb.length?'none':'block';
  const wl=$('#wrongList'); wl.innerHTML='';
  wb.forEach(w=>{
    const d=new Date(w.t||Date.now());
    const ds=(d.getMonth()+1)+'月'+d.getDate()+'日';
    const card=document.createElement('div'); card.className='favCard';
    card.innerHTML =
      `<div class="favMain">
        <div class="favMeta" style="margin:0 0 6px;"><span>${gmEsc(w.type)}题</span><span>🕐 ${ds}</span><span>《${gmEsc((w.title||'').slice(0,30))}》</span></div>
        <div class="wrongBody">${gmEsc(w.prompt)}<br>${gmEsc(w.body||'')}</div>
        <div class="wrongAns"><span class="bad">✗ 你的答案：${gmEsc(w.your||'—')}</span><span class="good">✓ 正确答案：${gmEsc(w.correct||'')}</span></div>
      </div>
      <button class="histDel" title="删除">✕</button>`;
    card.querySelector('.histDel').onclick=(ev)=>{ ev.stopPropagation(); removeWrong(w.id); };
    wl.appendChild(card);
  });
}

let ALL_TAGS=null;
function grammarTags(){
  if(ALL_TAGS) return ALL_TAGS;
  const set=new Set();
  TOPICS.forEach(t=>['intro','develop','data','debate','close'].forEach(r=>(t[r]||[]).forEach(x=>set.add(x.g))));
  ALL_TAGS=[...set];
  return ALL_TAGS;
}
function findGlossWord(en){
  const keys=Object.keys(GLOSSARY).filter(k=>!k.includes(' ') && k.length>=5);
  const hit=shuffle(keys).find(k=>new RegExp('\\b'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(en));
  return hit?{w:hit,cn:GLOSSARY[hit]}:null;
}
function makeTransQ(s,sents){
  const correct=s.cn;
  const readable=c=>(c.match(/的/g)||[]).length<4 && Math.abs(c.length-correct.length)<=correct.length*0.6;
  let others=shuffle(sents.map(x=>x.cn).filter(c=>c!==correct && readable(c)));
  if(others.length<3) others=shuffle(sents.map(x=>x.cn).filter(c=>c!==correct));
  others=others.slice(0,3);
  const opts=shuffle([correct].concat(others));
  return {type:'翻译', prompt:'选出下面英文句子的正确译文', body:s.en, options:opts, ans:opts.indexOf(correct)};
}
function makeGramQ(s){
  const tags=grammarTags().filter(t=>t!==s.g && !s.g.includes(t) && !t.includes(s.g));
  const opts=shuffle([s.g].concat(shuffle(tags).slice(0,3)));
  return {type:'语法', prompt:'这个句子主要运用了哪种语法结构？', body:s.en, options:opts, ans:opts.indexOf(s.g)};
}
function makeWordQ(s,w){
  const others=shuffle(Object.keys(GLOSSARY).filter(k=>GLOSSARY[k]!==w.cn && !k.includes(' ')))
    .slice(0,3).map(k=>GLOSSARY[k]);
  const opts=shuffle([w.cn].concat(others));
  return {type:'词汇', prompt:'句中 “'+w.w+'” 一词的含义最接近：', body:s.en, options:opts, ans:opts.indexOf(w.cn)};
}
/* ---------- 基于文章内容的阅读理解题（主旨/细节/词义，均为真题题型） ---------- */
/* 主旨大意题：正确项=本文主题短语，干扰项=其他题材随机生成的主题短语 */
function makeMainQ(p){
  if(!p.subjectEn) return null;
  const wrong=[];
  const others=shuffle(TOPICS.filter(t=>t.id!==p.topicId));
  for(const t of others){
    if(wrong.length>=3) break;
    try{
      const e=makeEntities(t);
      const dict=buildDicts(e);          /* 实体值是 {en,cn} 对象，需转字符串 */
      const sub=dict.dEn.subject;
      if(sub && sub!==p.subjectEn){
        wrong.push(sub.charAt(0).toUpperCase()+sub.slice(1));
      }
    }catch(err){}
  }
  if(wrong.length<3) return null;
  const correct=p.subjectEn.charAt(0).toUpperCase()+p.subjectEn.slice(1);
  const opts=shuffle([correct].concat(wrong.slice(0,3)));
  return {type:'主旨', prompt:'What is the passage mainly about?', body:'（根据全文内容判断）',
          options:opts, ans:opts.indexOf(correct)};
}
/* 提取句中的数字事实（金额/百分比/年份/数值） */
function numFacts(en){
  const out=[];
  let m;
  if((m=en.match(/\$[\d,\.]+\s*(?:billion|million|trillion)/i))) out.push({kind:'money', val:m[0]});
  else if((m=en.match(/\d+(?:\.\d+)?\s*percent/i))) out.push({kind:'pct', val:m[0]});
  else if((m=en.match(/\b(?:19|20)\d{2}\b/))) out.push({kind:'year', val:m[0]});
  else if((m=en.match(/\b\d[\d,]{1,6}\b/))) out.push({kind:'num', val:m[0]});
  return out;
}
/* 数字变形干扰项（×2、÷10、±20% 等，保持格式一致） */
function perturbNum(val, kind){
  const variants=[];
  const push=(v)=>{ if(v && v!==val && variants.indexOf(v)<0) variants.push(v); };
  if(kind==='money'){
    const m=val.match(/\$([\d,\.]+)\s*(billion|million|trillion)/i);
    const unit=m[2].toLowerCase();
    const n=parseFloat(m[1].replace(/,/g,''));
    const fmt=(x)=>'$'+(x%1?x.toFixed(1):x)+' '+unit;
    push(fmt(n*2)); push(fmt(Math.max(0.1,n/10))); push(fmt(n*5));
  } else if(kind==='pct'){
    const n=parseFloat(val);
    push((Math.min(96,n+21)).toFixed(n%1?1:0)+' percent');
    push((Math.max(2,Math.round(n/3)))+' percent');
    push((Math.min(98,n+44))+' percent');
  } else if(kind==='year'){
    const n=parseInt(val,10);
    push(String(n-10)); push(String(n+9)); push(String(n-24));
  } else {
    const n=parseInt(val.replace(/,/g,''),10);
    const fmt=(x)=>x>=1000?String(x):String(x);
    push(fmt(n*10)); push(fmt(Math.max(1,Math.round(n/10)))); push(fmt(Math.round(n*1.4)));
  }
  return variants;
}
/* 细节理解题：原文数字事实句 → 三个数字被篡改的干扰句，只有原句为真 */
function makeDetailQ(s){
  const facts=numFacts(s.en);
  if(!facts.length) return null;
  const f=facts[0];
  const vars=perturbNum(f.val, f.kind);
  if(vars.length<3) return null;
  const correct=s.en;
  const wrong=vars.map(v=>s.en.split(f.val).join(v));
  if(new Set([correct].concat(wrong)).size<4) return null;
  const opts=shuffle([correct].concat(wrong));
  return {type:'细节', prompt:'According to the passage, which of the following statements is correct?',
          body:'（依据文中数据判断）', options:opts, ans:opts.indexOf(correct)};
}
/* 组卷：主旨 1 + 数字细节 2 + 词义/细节补足至 5 题，全部基于文章内容 */
function buildCompQuiz(p){
  const sents=[]; p.paras.forEach(pa=>pa.forEach(s=>sents.push(s)));
  const items=[];
  const main=makeMainQ(p);
  if(main) items.push(main);
  /* 细节题：取不同段落里带数字的事实句 */
  const usedSent=new Set();
  for(const s of shuffle(sents)){
    if(items.filter(x=>x.type==='细节').length>=2) break;
    if(usedSent.has(s)) continue;
    const dq=makeDetailQ(s);
    if(dq){ items.push(dq); usedSent.add(s); }
  }
  /* 词义猜测题（上下文猜词）补位 */
  for(const s of shuffle(sents)){
    if(items.length>=5) break;
    if(usedSent.has(s)) continue;
    const w=findGlossWord(s.en);
    if(w){ items.push(makeWordQ(s,w)); usedSent.add(s); }
  }
  /* 翻译题兜底（极少触发） */
  for(const s of shuffle(sents)){
    if(items.length>=5) break;
    if(usedSent.has(s)) continue;
    items.push(makeTransQ(s,sents)); usedSent.add(s);
  }
  return items.slice(0,5);
}
function buildQuiz(p){
  const sents=[]; p.paras.forEach(pa=>pa.forEach(s=>sents.push(s)));
  const items=[];
  shuffle(sents.map((s,i)=>i)).slice(0,8).forEach((i,k)=>{
    if(items.length>=5) return;
    const s=sents[i];
    const type=['trans','gram','word'][k%3];
    if(type==='word'){
      const w=findGlossWord(s.en);
      if(w){ items.push(makeWordQ(s,w)); return; }
      items.push(makeTransQ(s,sents)); return;
    }
    items.push(type==='gram' ? makeGramQ(s) : makeTransQ(s,sents));
  });
  return items;
}
let quiz=null;
let qMode=(function(){ try{ return localStorage.getItem('yt_qmode')||'exam'; }catch(e){ return 'exam'; } })();
let wordFilter=(function(){ try{ return localStorage.getItem('yt_wordfilter')||'all'; }catch(e){ return 'all'; } })();
function wordMatchesFilter(e){
  if(wordFilter==='all') return true;
  const tags=String(e[5]||'');
  if(wordFilter==='cet4') return /四级|高考/.test(tags);
  if(wordFilter==='cet6') return /六级|四级|高考/.test(tags);
  return /考研|六级|四级|高考/.test(tags);   /* 考研：涵盖四六级基础词 */
}
function applyWordFilterUI(){
  const seg=document.getElementById('wordFilter'); if(!seg) return;
  [...seg.children].forEach(function(b){ b.classList.toggle('on', b.dataset.wf===wordFilter); });
}
function bindWordFilter(){
  const seg=document.getElementById('wordFilter');
  if(seg) seg.addEventListener('click', function(ev){
    const b=ev.target.closest('button'); if(!b) return;
    wordFilter=b.dataset.wf||'all';
    try{ localStorage.setItem('yt_wordfilter', wordFilter); }catch(e){}
    applyWordFilterUI();
    startGroup();
    showToast(wordFilter==='all'?'背词范围：全部':'背词范围已切换（'+b.textContent+'）');
  });
}
function applyQModeBtn(){
  const b=document.getElementById('qModeBtn'); if(!b) return;
  b.textContent = qMode==='exam' ? '🎓 考试' : '📝 练习';
  b.title = qMode==='exam' ? '考试模式：作答不判分，提交后统一出分（点击切换练习模式）' : '练习模式：每题即时判分（点击切换考试模式）';
}
function openQuiz(overrides, from){
  if(!curPassage) return;
  /* 题目来源优先级：外部传入（错题重刷）→ AI 出题（随文章生成）→ 本地文章理解题（主旨/细节/词义）→ 旧兜底题 */
  let items=(overrides && overrides.length>=4) ? shuffle(overrides).slice(0,10) : null;
  if(!items){
    if(curPassage.qs && curPassage.qs.length>=4){
      items=curPassage.qs.map(q=>({
        type:(q.kind||'阅读')+'题', prompt:String(q.stem||''), body:'',
        options:(q.opts||[]).map(o=>String(o)), ans:Number(q.ans)||0, why:String(q.why||'')
      }));
    }
    if(!items || items.length<4){
      const comp=buildCompQuiz(curPassage);
      items=(items||[]).concat(comp).slice(0,5);
    }
    if(items.length<4){ items=buildQuiz(curPassage); }   /* 极端兜底 */
  }
  quiz={items:items, idx:0, right:0, submitted:false, source:from||null};
  quiz.answers=new Array(quiz.items.length).fill(null);
  showOnly('quiz');
  renderQuestion();
  window.scrollTo(0,0);
}
/* 真题作答模式：先作答（可改），全部提交后才显示得分与答案 */
function renderQuestion(){
  const q=quiz.items[quiz.idx];
  $('#qCount').textContent='第 '+(quiz.idx+1)+' 题 / 共 '+quiz.items.length+' 题';
  $('#qBar').style.width=((quiz.idx+1)/quiz.items.length*100)+'%';
  $('#qType').textContent=q.type+'题';
  $('#qStem').textContent=q.prompt;
  $('#qBody').textContent=q.body;
  const box=$('#qOptions'); box.innerHTML='';
  const exam=(qMode==='exam');
  const sel=exam ? quiz.answers[quiz.idx] : q.yourIdx;
  q.options.forEach((opt,i)=>{
    let cls='qOpt';
    if(exam){
      if(sel===i) cls+=' sel';
    } else if(q.yourIdx!=null){
      if(i===q.ans) cls+=' right';
      else if(q.yourIdx===i) cls+=' wrong';
    }
    const b=document.createElement('button'); b.className=cls;
    b.innerHTML='<b>'+'ABCD'[i]+'</b>'+gmEsc(opt);
    b.onclick=()=>{
      if(!exam){
        /* 练习模式：即时判分，答后锁定 */
        if(q.yourIdx!=null) return;
        q.yourIdx=i;
        q.your=q.options[i];
        if(q.yourIdx===q.ans) quiz.right++; else addWrong(q);
        renderQuestion();
        return;
      }
      quiz.answers[quiz.idx]=i;
      [...box.children].forEach((x,j)=>x.classList.toggle('sel', j===quiz.answers[quiz.idx]));
      const answered=quiz.answers.filter(a=>a!=null).length;
      $('#qSubmit').textContent='✓ 提交答案'+(answered<quiz.items.length?('（已答 '+answered+'/'+quiz.items.length+'）'):'');
    };
    box.appendChild(b);
  });
  if(!exam && q.your!=null){
    const ok=(q.yourIdx===q.ans);
    const res=document.createElement('div'); res.className='qRevAns';
    res.textContent=(ok?'✅ 回答正确':'❌ 回答错误')+' ｜ 正确答案 '+'ABCD'[q.ans];
    box.appendChild(res);
  }
  $('#qDoneBox').style.display='none';
  $('#qReview').style.display='none';
  $('#qStudy').style.display='block';
  /* 导航：上一题/下一题 + 提交（考试）/ 查看成绩（练习） */
  $('#qNav').style.display='flex';
  $('#qPrev').style.display=(quiz.idx===0)?'none':'block';
  const last=(quiz.idx===quiz.items.length-1);
  $('#qNext').style.display=last?'none':'block';
  $('#qSubmit').style.display=last?'block':'none';
  if(exam){
    const answered=quiz.answers.filter(a=>a!=null).length;
    $('#qSubmit').textContent='✓ 提交答案'+(answered<quiz.items.length?('（已答 '+answered+'/'+quiz.items.length+'）'):'');
  } else {
    $('#qSubmit').textContent='📊 查看成绩';
  }
  $('#qAgain').style.display='none';
  applyQModeBtn();
}
function submitQuiz(){
  if(qMode==='practice'){ renderQuizDone(); return; }   /* 练习模式：作答时已即时计分 */
  const unanswered=quiz.answers.filter(a=>a==null).length;
  if(unanswered>0 && !confirm('还有 '+unanswered+' 题未作答，确定提交吗？')) return;
  quiz.submitted=true;
  quiz.right=0;
  quiz.items.forEach((q,i)=>{
    q.yourIdx=quiz.answers[i];
    q.your=(q.yourIdx!=null)?q.options[q.yourIdx]:null;
    if(q.yourIdx===q.ans) quiz.right++;
    else addWrong(q);
  });
  renderQuizDone();
}
function renderQuizDone(){
  $('#qCount').textContent='已完成';
  $('#qBar').style.width='100%';
  $('#qStudy').style.display='none';
  $('#qNav').style.display='none';
  $('#qSubmit').style.display='none';
  const total=quiz.items.length, wrong=total-quiz.right;
  $('#qDoneBox').style.display='block';
  $('#qScore').textContent='得分 '+quiz.right+' / '+total;
  $('#qDoneSub').innerHTML = wrong
    ? ('错 '+wrong+' 题已加入错题本，<br>可在「我的书房 → 错题本」复习')
    : '全部正确，没有新错题 👏';
  /* 逐题答案详解 */
  const list=$('#qReview'); list.innerHTML='';
  quiz.items.forEach((q,i)=>{
    const ok=(q.yourIdx===q.ans);
    const d=document.createElement('div'); d.className='qReviewItem';
    const head=document.createElement('div'); head.className='qRevHead';
    head.innerHTML='<span class="wTag">'+q.type+'题</span><span class="qRevNo">第 '+(i+1)+' 题</span>'+
      '<span class="qRevRes '+(ok?'g':'r')+'">'+(ok?'✓ 答对':'✗ 答错')+'</span>';
    d.appendChild(head);
    const stem=document.createElement('p'); stem.className='qStem'; stem.textContent=q.prompt; d.appendChild(stem);
    if(q.body){ const body=document.createElement('p'); body.className='qBody'; body.textContent=q.body; d.appendChild(body); }
    const opts=document.createElement('div');
    q.options.forEach((opt,j)=>{
      const b=document.createElement('button'); b.className='qOpt';
      if(j===q.ans) b.classList.add('right');
      else if(q.your===opt) b.classList.add('wrong');
      b.disabled=true;
      b.innerHTML='<b>'+'ABCD'[j]+'</b>';
      b.appendChild(document.createTextNode(opt));
      opts.appendChild(b);
    });
    d.appendChild(opts);
    const ans=document.createElement('div'); ans.className='qRevAns';
    ans.textContent='正确答案 '+'ABCD'[q.ans]+' ｜ 你的答案：'+(q.your||'未作答')+(q.why?'\n📖 解析：'+q.why:'');
    d.appendChild(ans);
    list.appendChild(d);
  });
  list.style.display='block';
  $('#qAgain').style.display='block';
  window.scrollTo(0,0);
}
$('#qPrev').onclick=()=>{ if(quiz.idx>0){ quiz.idx--; renderQuestion(); } };
$('#qNext').onclick=()=>{ if(quiz.idx<quiz.items.length-1){ quiz.idx++; renderQuestion(); } };
$('#qSubmit').onclick=submitQuiz;
$('#qAgain').onclick=()=>{ openQuiz(quiz.source==='wrong'?wrongQuizItems():null, quiz.source); };
$('#qModeBtn').onclick=()=>{
  qMode = qMode==='exam' ? 'practice' : 'exam';
  try{ localStorage.setItem('yt_qmode', qMode); }catch(e){}
  applyQModeBtn(); renderQuestion();
  showToast(qMode==='exam'?'已切换考试模式：提交后统一出分':'已切换练习模式：每题即时判分');
};
$('#redoWrong').onclick=()=>{
  const items=wrongQuizItems();
  if(items.length){ showOnly('quiz'); openQuiz(items,'wrong'); }
};
/* 错题重刷：把错题本里有选项的错题组成一组测验 */
function wrongQuizItems(){
  const wb=getWrongBook();
  const items=wb.filter(function(w){ return w.options && w.options.length>=4 && w.options.indexOf(w.correct)>=0; })
    .map(function(w){ return {type:w.type+'·重刷', prompt:w.prompt, body:w.body||'', options:w.options, ans:w.options.indexOf(w.correct), why:''}; });
  if(!items.length) showToast('暂无可重刷的错题（旧版错题缺少选项数据）');
  return items;
}
$('#quizBtn').onclick=openQuiz;
$('#qBack').onclick=()=>{ showReader(); };

/* ---------- 15选10 选词填空 ---------- */
const CLOZE_LEVELS = {
  cet4:{label:'四级', diff:'cet4', plan:[['intro',3],['bg',1],['develop',4],['debate',2],['data',1],['close',1]]},
  cet6:{label:'六级', diff:'cet6', plan:[['intro',4],['bg',1],['develop',5],['debate',2],['close',1]]},
  kao: {label:'考研', diff:'plus', plan:[['intro',4],['bg',2],['develop',5],['debate',2],['close',1]]}
};
let clozeLevel='cet4', cloze=null, clzSel=null;

const STOPW=new Set(('the a an and or but of to in on for with by at as is are was were be been being that this these those it its their his her our your my from into over under more most than then when while which who whom whose what where why how not no nor so if because during through between among about against without within upon per via each other another such own same very can could may might must shall should will would do does did done have has had having also both few many much some any every out up down off over again once only just even still ever never here there all s t don won didn isn aren wasn weren hasn haven').split(' '));
let WB_MAP_C=null;
function wordMap(){
  if(WB_MAP_C) return WB_MAP_C;
  WB_MAP_C={};
  WORD_BANK.forEach(function(b){ WB_MAP_C[b[0].toLowerCase()]={cn:b[2], pos:(b[2].split(/[.， ]/)[0]||'').toLowerCase()}; });
  return WB_MAP_C;
}
let ENT_W=null;
function entWords(){
  if(ENT_W) return ENT_W;
  const s=new Set();
  [RESEARCHERS,INSTS,JOURNALS,CITIES,ORGS,MONEY].forEach(function(a){ a.forEach(function(x){
    String(x.en||'').toLowerCase().replace(/[^a-z ]/g,' ').split(/\s+/).forEach(function(w){ if(w.length>1) s.add(w); });
  }); });
  ENT_W=s; return s;
}
function openCloze(lv){
  clozeLevel=lv||clozeLevel||'cet4';
  stopTts();
  showOnly('cloze');
  syncClozeSegs();
  if(cloze1Mode==='cloze1'){ buildCloze1(); }
  else { $('#cLevel').textContent=CLOZE_LEVELS[clozeLevel].label; buildClozePassage(); }
  window.scrollTo(0,0);
}
async function buildClozePassage(){
  if(AI_MODE && AI_BUSY){ showToast('有 AI 任务进行中，请稍候…'); return; }
  if(AI_MODE){
    AI_BUSY=true; aiLoadingShow('🌐 AI 生成选词填空');
    var ai=null;
    try{ ai=await aiBuildCloze(); }catch(e){}
    if(ai){ aiLoadingDone(true); await aiLoadingWait(1300); aiLoadingHide(); showToast('✅ AI 生成成功'); }
    else{ aiLoadingDone(false,'已改用本地生成'); await aiLoadingWait(1300); aiLoadingHide(); showToast('❌ AI 生成失败，已改用本地生成'); }
    if(ai){
      aiHistPush('cloze', ai.titleEn);
      cloze={kind:'ai', levelLabel:cl.label, title:ai.titleEn, titleCn:ai.titleCn,
             paras:ai.paras, options:ai.options, answers:ai.answers,
             blanks:ai.answers.map(function(w,k){ var o=ai.options.find(function(x){ return x.w.toLowerCase()===w.toLowerCase(); })||{};
               return {k:k, word:w, opt:o, user:null, ok:null}; }),
             bank:ai.options.map(function(o,i){ return {letter:o.letter, word:o.w, pos:o.pos, cn:o.cn, used:false}; }),
             user:new Array(10).fill(null), done:false, right:0, src:'ai'};
      renderAICloze();
      window.scrollTo(0,0);
      return;
    }
    showToast('❌ AI 生成失败，已改用本地生成');
  }
  try{ await ensureWordBank(); }catch(e){ showToast('词库加载失败，请检查网络后重试'); return; }
  cloze=buildLocalClozeData(clozeLevel);
  renderCloze();
}
/* 本地选词填空构造（独立函数：仿真模考复用同一数据形态） */
function buildLocalClozeData(lv, nBlanks, withBank, passageOverride){
  nBlanks=nBlanks||10; if(withBank===undefined) withBank=true;
  const cl=CLOZE_LEVELS[lv];
  const p=passageOverride || buildPassage(cl.diff, cl.plan);   /* 按真题选词填空篇幅（四级 200-250 词 / 六级 250-300 词）出短文 */
  const sents=[]; p.paras.forEach(function(pa){ pa.forEach(function(s){ sents.push(s); }); });
  /* 全文词频（多次出现的词不挖空，避免泄答案） */
  const freq={};
  sents.forEach(function(s){ s.en.split(' ').forEach(function(t){
    const k=t.toLowerCase().replace(/[^a-z]/g,''); if(k) freq[k]=(freq[k]||0)+1; }); });
  const ew=entWords(), wm=wordMap();
  const cand=[];
  sents.forEach(function(s,si){
    s.en.split(' ').forEach(function(tok,ti){
      const low=tok.toLowerCase().replace(/[^a-z]/g,'');
      if(low.length<4 || tok!==low) return;          // 排除短词/专名/句首大写/带标点
      if(STOPW.has(low) || ew.has(low)) return;
      if(!wm[low]) return;                           // 仅选词库内单词，保证可给出释义
      if((freq[low]||0)>1) return;
      let sc=3; const m=wm[low];
      if(m.pos) sc+=1;
      if(low.length>=7) sc+=1;
      cand.push({word:low, sent:si, ti:ti, score:sc, m:m});
    });
  });
  cand.sort(function(a,b){ return b.score-a.score || a.sent-b.sent; });
  /* 词性多样贪心挖 10 空：一句一空、每类词性最多 3 个 */
  const blanks=[], cls={}, usedSent={};
  for(let i=0;i<cand.length && blanks.length<nBlanks;i++){
    const c=cand[i];
    if(usedSent[c.sent] || blanks.some(function(b){ return b.word===c.word; })) continue;
    const pc=(c.m&&c.m.pos?c.m.pos:'x').charAt(0);
    if(cls[pc]>=3) continue;
    blanks.push({sent:c.sent, ti:c.ti, word:c.word, m:c.m, user:null, ok:null});
    cls[pc]=(cls[pc]||0)+1; usedSent[c.sent]=1;
  }
  for(let i=0;i<cand.length && blanks.length<nBlanks;i++){   // 放宽词性补齐
    const c=cand[i];
    if(usedSent[c.sent] || blanks.some(function(b){ return b.word===c.word; })) continue;
    blanks.push({sent:c.sent, ti:c.ti, word:c.word, m:c.m, user:null, ok:null});
    usedSent[c.sent]=1;
  }
  /* 空格序号严格按文章顺序 1→N */
  blanks.sort(function(a,b){ return a.sent-b.sent || a.ti-b.ti; });
  /* 词库：N 正确词 + 5 干扰项（按空格词性配比，均不在文中出现）；完形模式不需要词库 */
  if(!withBank){
    return {level:lv, passage:p, sents:sents, blanks:blanks, done:false, right:0, bank:[]};
  }
  let bank=blanks.map(function(b){ return b.word; });
  const inText=sents.map(function(s){ return s.en.toLowerCase(); }).join(' ');
  let pool=Object.keys(wm).filter(function(w){ return w.length>=4 && !inText.includes(w) && bank.indexOf(w)<0; });
  pool=shuffle(pool);
  const classes={}; blanks.forEach(function(b){ const pc=(b.m&&b.m.pos?b.m.pos:'x').charAt(0); classes[pc]=(classes[pc]||0)+1; });
  let need=5;
  Object.keys(classes).forEach(function(pc){
    if(need<=0) return;
    const w=pool.find(function(w){ return (wm[w].pos||'x').charAt(0)===pc && bank.indexOf(w)<0; });
    if(w){ bank.push(w); need--; }
  });
  pool.some(function(w){ if(need<=0) return true; if(bank.indexOf(w)<0){ bank.push(w); need--; } return need<=0; });
  bank=shuffle(bank);
  return {level:lv, passage:p, sents:sents, blanks:blanks, done:false, right:0,
          bank:bank.map(function(w,i){ return {letter:'ABCDEFGHIJKLMNO'[i], word:w, used:false}; })};
}
function renderCloze(){
  const c=cloze;
  if(c.kind==='ai'){ renderAICloze(); return; }
  $('#cLevel').textContent=CLOZE_LEVELS[c.level].label;
  let html='', fi=0;
  c.passage.paras.forEach(function(pa){
    html+='<p>';
    pa.forEach(function(s){
      let b=null;
      c.blanks.forEach(function(bb){ if(bb.sent===fi) b=bb; });
      let toks=s.en.split(' ');
      if(b){
        const k=c.blanks.indexOf(b);
        let inner;
        if(!c.done) inner = b.user ? b.user : '<i>'+(k+1)+'</i>';
        else if(b.ok) inner = b.word;                                        /* 填对：绿色单词 */
        else if(b.user) inner = '<s>'+b.user+'</s><span class="cw">'+b.word+'</span>';  /* 填错：旁边给正确答案 */
        else inner = '<span class="cw">'+b.word+'</span>';                    /* 未填：直接给正确答案 */
        toks[b.ti]='<span class="clz'+(c.done?(b.ok?' ok':' bad'):(b.user?' sel':''))+'" data-b="'+k+'">'+inner+'</span>';
      }
      html+=toks.join(' ')+' ';
      if(c.done) html+='<span class="cnT">'+s.cn+'</span>';
      fi++;
    });
    html+='</p>';
  });
  $('#clozePassage').innerHTML=html;
  const bk=$('#clzBank'); bk.innerHTML='';
  c.bank.forEach(function(w){
    const b=document.createElement('button');
    b.className='clzChip'+(w.used?' used':'')+(clzSel===w.word?' sel':'');
    b.innerHTML='<b>'+w.letter+'</b>'+w.word;
    b.onclick=function(){ chipClick(w); };
    bk.appendChild(b);
  });
  $('#cSubmit').style.display=c.done?'none':'block';
  $('#cNew').style.display=c.done?'block':'none';
}
function chipClick(w){
  if(cloze.done){ showMeaning(w.word); return; }      /* 提交后：点词库单词看释义 */
  if(w.used){ showToast('这个词已经填入了'); return; }
  const mz=document.getElementById('clzMeaning'); mz.classList.remove('shown');
  clzSel = (clzSel===w.word) ? null : w.word;
  renderCloze();
}
function showMeaning(word){
  const m=wordMap()[word];
  const mz=document.getElementById('clzMeaning');
  mz.innerHTML='<b>'+word+'</b> — '+(m?m.cn:'（暂无释义）');
  mz.classList.add('shown');
}
$('#clozePassage').addEventListener('click', function(e){
  const el=e.target.closest('.clz'); if(!el || cloze.done || cloze.kind==='ai') return;
  const b=cloze.blanks[+el.dataset.b];
  if(cloze.done){ showMeaning(b.word); return; }      /* 提交后：点空格也可看该词释义 */
  if(b.user){                                    // 取回
    const bk=cloze.bank.find(function(x){ return x.word===b.user; });
    if(bk) bk.used=false;
    b.user=null;
  }else if(clzSel){                              // 填入
    b.user=clzSel;
    const bk=cloze.bank.find(function(x){ return x.word===clzSel; });
    if(bk) bk.used=true;
    clzSel=null;
  }else{ showToast('先在下方词库点选一个单词'); return; }
  renderCloze();
});
function gradeCloze(){
  if(cloze.done) return;
  cloze.done=true;                                /* 未填也可提交，未填处直接给正确答案 */
  let right=0;
  cloze.blanks.forEach(function(b,k){
    b.ok=!!b.user && (b.user.toLowerCase()===b.word);
    if(b.ok) right++;
    else addWrong({type:'选词', prompt:'选词填空 · 第'+(k+1)+'空'+(b.m?'（'+b.m.pos+'）':''),
      body:sentWithBlank(b), correct:b.word+'（'+(b.m?b.m.cn:'')+'）', your:b.user||'未填',
      title:cloze.passage.titleEn});
  });
  cloze.right=right;
  renderCloze();
  showToast('得分 '+right+' / 10'+(right===10?'，全部正确 🎉':'，错题已加入错题本'));
  window.scrollTo(0,0);
}
function sentWithBlank(b){
  const s=cloze.sents[b.sent];
  const toks=s.en.split(' '); toks[b.ti]='____';
  return toks.join(' ');
}
$('#cSubmit').onclick=function(){ if(cloze.kind==='ai') gradeAICloze(); else gradeCloze(); };
function renderAICloze(){
  const c=cloze;
  $('#cLevel').textContent=c.levelLabel;
  $('#cSubmit').style.display=c.done?'none':'block';
  $('#cNew').style.display=c.done?'block':'none';
  const box=document.getElementById('clozePassage'); box.innerHTML='';
  c.paras.forEach(function(pa,pi){
    const p=document.createElement('p');
    p.innerHTML=gmEsc(pa.en).replace(/__(\d+)__/g, function(m,n){
      const k=parseInt(n,10)-1;
      if(k<0||k>=c.blanks.length) return m;
      const b=c.blanks[k];
      let inner;
      if(c.done){ inner = b.ok? gmEsc(b.word) : (b.user? '<s>'+gmEsc(b.user)+'</s>' : '')+'<span class="cw">'+gmEsc(b.word)+'</span>'; }
      else inner = b.user? gmEsc(b.user) : '<i>'+n+'</i>';
      return '<span class="clz'+(c.done?(b.ok?' ok':' bad'):(b.user?' sel':''))+'" data-k="'+k+'">'+inner+'</span>';
    });
    if(c.done){ const t=document.createElement('span'); t.className='cnT'; t.textContent=pa.cn; p.appendChild(t); }
    box.appendChild(p);
  });
  const bk=document.getElementById('clzBank'); bk.innerHTML='';
  c.options.forEach(function(o){
    const b=document.createElement('button');
    b.className='clzChip'+(o.used?' used':'')+(clzSel===o.w?' sel':'');
    b.innerHTML='<b>'+o.letter+'</b>'+o.w;
    b.onclick=function(){ aiChipClick(o); };
    bk.appendChild(b);
  });
}
function aiChipClick(o){
  if(cloze.done){ showMeaningAI(o); return; }
  if(o.used){ showToast('这个词已经填入了'); return; }
  clzSel=(clzSel===o.w)?null:o.w;
  renderAICloze();
}
function showMeaningAI(o){
  const mz=document.getElementById('clzMeaning');
  mz.innerHTML='<b>'+o.w+'</b> — '+(o.pos?o.pos+' ':'')+(o.cn||'（暂无释义）');
  mz.classList.add('shown');
}
$('#clozePassage').addEventListener('click', function(e){
  if(cloze.kind!=='ai') return;
  const el=e.target.closest('.clz'); if(!el || cloze.done) return;
  const k=+el.dataset.k;
  const b=cloze.blanks[k];
  if(b.user){                                     // 取回
    const o=cloze.options.find(function(x){ return x.w===b.user; });
    if(o) o.used=false;
    b.user=null;
  }else if(clzSel){                               // 填入
    b.user=clzSel;
    const o=cloze.options.find(function(x){ return x.w===clzSel; });
    if(o) o.used=true;
    clzSel=null;
  }else{ showToast('先在下方词库点选一个单词'); return; }
  renderAICloze();
});
function gradeAICloze(){
  if(cloze.done) return;
  cloze.done=true;
  let right=0;
  cloze.blanks.forEach(function(b,k){
    b.ok=!!b.user && (b.user.toLowerCase()===b.word.toLowerCase());
    if(b.ok) right++;
    else{
      const para=c.paras.find(function(p){ return p.en.indexOf('__'+(k+1)+'__')>=0; });
      addWrong({type:'选词', prompt:'AI选词填空 · 第'+(k+1)+'空'+(b.opt?'（'+b.opt.pos+'）':''),
        body:(para?para.en.slice(0,140):'（原段）'), correct:b.word+'（'+(b.opt?b.opt.pos+' '+b.opt.cn:'')+'）',
        your:b.user||'未填', title:cloze.title});
    }
  });
  cloze.right=right;
  renderAICloze();
  showToast('得分 '+right+' / 10'+(right===10?'，全部正确 🎉':'，错题已加入错题本'));
  window.scrollTo(0,0);
}
$('#cNew').onclick=function(){ buildClozePassage(); window.scrollTo(0,0); };
$('#clozeLevel').addEventListener('click', function(e){
  const b=e.target.closest('button'); if(!b || b.dataset.v===clozeLevel) return;
  openCloze(b.dataset.v);
});
$('#cBack').onclick=showHome;

function fillSlots(text,slots){
  return text.replace(/\{(\w+)\}/g,function(m,k){
    const v=slots[k]||slots[k+'Cn'];
    if(!v) return m;
    const pick=v[Math.floor(Math.random()*v.length)];
    return (k.endsWith('Cn'))?pick[1]:pick[0];
  });
}
function normWords(t){ return t.toLowerCase().replace(/[^a-z' ]/g,' ').split(/\s+/).filter(Boolean); }
function alignPairs(T,R){
  const m=T.length,n=R.length;
  const dp=[]; for(let i=0;i<=m;i++){ dp.push(new Array(n+1).fill(0)); }
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    dp[i][j]=(T[i-1]===R[j-1])?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  const pairs=[]; let i=m,j=n;
  while(i>0&&j>0){
    if(T[i-1]===R[j-1]){ pairs.push([i-1,j-1]); i--; j--; }
    else if(dp[i-1][j]>=dp[i][j-1]) i--; else j--;
  }
  pairs.reverse();
  return pairs;
}
/* ---------- 录音跟读（逐句模式） ---------- */
const SCENES=[
 {icon:'☕', name:'咖啡店', roles:['店员','顾客'],
  lines:[
   [0,'Good morning! Welcome to {brand}. What can I get started for you today?','早上好！欢迎光临{brandCn}。今天想喝点什么？'],
   [1,'Hi! Could I have a {drink}, please? I really need the caffeine.','你好！请给我来一杯{drinkCn}，我真的很需要咖啡因。'],
   [0,'Great choice. What size would you like? We have three sizes.','好选择。您要什么尺寸？我们有三种规格。'],
   [1,'A {size} one, please. And please make it extra hot.','请来{sizeCn}杯，麻烦做烫一点。'],
   [0,'Sure thing. Would you like me to add any sugar?','没问题。需要加糖吗？'],
   [1,'No sugar, thanks. Maybe just a little milk on the side.','不用加糖，谢谢。旁边配一点牛奶就好。'],
   [0,'Of course. Anything to eat with that this morning?','好的。今天要配点什么吃的吗？'],
   [1,'Hmm, what would you recommend from the display case?','嗯，展示柜里有什么推荐的吗？'],
   [0,'Our {snack} is really popular. It goes perfectly with coffee.','我们的{snackCn}非常受欢迎，和咖啡是绝配。'],
   [1,'Sounds amazing. I will take one of those, please.','听起来太棒了，那就要一个。'],
   [0,'Excellent choice. Is that for here or to go?','好眼光。在这里喝还是带走？'],
   [1,'To go, please. I am heading straight to the office.','带走，谢谢。我要直接去公司。'],
   [0,'No worries, I will pack it separately for you.','放心，我会帮您分开包装。'],
   [1,'Perfect. How much does everything come to today?','太好了，今天一共多少钱？'],
   [0,'That will be {price} in total, coffee and snack together.','咖啡加点心一共{price}。'],
   [1,'Here you are. Do you take mobile payment here?','给您。这里可以用手机支付吗？'],
   [0,'Yes, just scan the code at the counter and you are done.','可以，扫描柜台上的二维码就行了。'],
   [1,'Amazing. Here is my receipt — thanks a lot, have a great day!','太好了。这是我的小票——多谢，祝您今天愉快！']],
  slots:{brand:[['Sunlight Coffee','阳光咖啡'],['Blue Bean','蓝豆咖啡'],['Morning Brew','晨酿咖啡']],
         drink:[['latte','拿铁'],['cappuccino','卡布奇诺'],['hot chocolate','热巧克力'],['iced americano','冰美式']],
         size:[['small','小'],['medium','中'],['large','大']],
         snack:[['blueberry muffin','蓝莓玛芬'],['butter croissant','黄油可颂'],['chocolate cookie','巧克力曲奇']],
         price:[['three dollars and fifty cents','三美元五角'],['four dollars and twenty cents','四美元二角'],['five dollars','五美元']]}},
 {icon:'🗺️', name:'问路', roles:['路人','问路者'],
  lines:[
   [0,'Excuse me, sorry to bother you — could you tell me how to get to {place}?','打扰一下，抱歉麻烦您——请问{placeCn}怎么走？'],
   [1,'No problem at all. It is actually quite close from here.','完全没问题。它离这里其实很近。'],
   [0,'Oh great. Should I walk, or should I take the bus?','太好了。我该走路去，还是坐公交车？'],
   [1,'Walking is easier. Go straight for about {dist}, then turn left at the lights.','走路更方便。直走约{distCn}，在红绿灯处左转。'],
   [0,'Left at the lights — and then what should I do?','红绿灯左转——然后我该怎么做？'],
   [1,'Keep going until you see a blue sign on your right.','一直走到你看到右边有块蓝色指示牌。'],
   [0,'A blue sign on the right. Is it far from the lights?','右边的蓝色指示牌。离红绿灯远吗？'],
   [1,'About {mins} minutes on foot. You really cannot miss it.','步行大约{minsCn}分钟，你一定不会错过。'],
   [0,'Perfect. One more thing — do you know if it is open now?','太好了。再问一句——你知道它现在开门了吗？'],
   [1,'It opens at nine and closes at {time}, so you have plenty of time.','九点开门，{timeCn}关门，你的时间很充裕。'],
   [0,'Wonderful. Is there a bus stop nearby in case I get tired?','太好了。万一我走累了，附近有公交站吗？'],
   [1,'Yes, there is one right outside the supermarket across the street.','有，就在马路对面超市门口。'],
   [0,'You have been so helpful. Thank you very much!','你帮了大忙，非常感谢！'],
   [1,'You are welcome. Enjoy your visit to our neighborhood!','不客气，祝你在我們社区玩得开心！'],
   [0,'By the way, is there anywhere good to eat around there?','顺便问一下，那附近有什么好吃的吗？'],
   [1,'Plenty! There is a small noodle place right next door to it.','多得很！隔壁就有一家小面馆。'],
   [0,'A noodle place next door — I will definitely remember that.','隔壁的面馆——我一定记住了。'],
   [1,'No problem at all. Have a lovely afternoon!','不客气，祝你下午愉快！']],
  slots:{place:[['the city library','市图书馆'],['the railway station','火车站'],['the Central Museum','中央博物馆']],
         dist:[['two hundred metres','两百米'],['a hundred metres','一百米'],['three hundred metres','三百米']],
         mins:[['five','五'],['ten','十'],['fifteen','十五']],
         time:[['six o\'clock','六点'],['half past five','五点半'],['seven o\'clock','七点']]}},
 {icon:'📚', name:'图书馆', roles:['图书管理员','学生'],
  lines:[
   [0,'Hi, I would like to borrow these three books, please.','你好，我想借这三本书。'],
   [1,'Sure, no problem. Do you have your library card with you today?','好的，没问题。你今天带图书证了吗？'],
   [0,'Here it is. Oh wait — there is a small note on my account.','在这。哦等等——我的账户上有一条提示。'],
   [1,'Let me see. You have an overdue book from {time} last month.','我看看。你上个月{timeCn}借的一本书过期了。'],
   [0,'Oh no, I completely forgot about that one. What should I do?','糟糕，我把那本完全忘了。该怎么办？'],
   [1,'Do not worry. Just return it within a week and pay a small fine.','别担心，一周内还回来，交一点罚款就行。'],
   [0,'Okay, I will bring it back tomorrow morning. Is that fine?','好的，我明天早上带回来，可以吗？'],
   [1,'That is perfectly fine. Now, these three books are due in two weeks.','完全可以。这三本书两周后到期。'],
   [0,'Two weeks. Can I renew them online if I need more time?','两周。如果需要更久，可以网上续借吗？'],
   [1,'Yes, you can renew each book once, but only if nobody has reserved it.','可以，每本续借一次，前提是没人预约。'],
   [0,'Good to know. Is there a fine if I return them late?','了解了。晚还会有罚款吗？'],
   [1,'Twenty cents a day per book, and reservations come first after that.','每本书每天两毛，逾期后预约者优先。'],
   [0,'Understood. Also, could you help me find books about {topic}?','明白了。另外，能帮我找找{topicCn}方面的书吗？'],
   [1,'Of course. They are on the second floor, in aisle twelve.','当然，在二楼十二号书架。'],
   [0,'Aisle twelve on the second floor. Are there any study rooms there too?','二楼十二号书架。那里还有自习室吗？'],
   [1,'Yes, four study rooms — you can book them for two hours at a time.','有四间自习室，每次可以预约两小时。'],
   [0,'That is really useful. Thanks a lot for your help today!','太有用了，今天非常感谢你的帮助！'],
   [1,'My pleasure. If you need anything else, just come to this desk.','乐意效劳。还需要什么，随时来这个柜台。']],
  slots:{time:[['three o\'clock','三点'],['last Tuesday','上周二'],['the fifth','五号']],
         topic:[['world history','世界历史'],['modern art','现代艺术'],['marine biology','海洋生物']]}},
 {icon:'👥', name:'小组讨论', roles:['同学','组员'],
  lines:[
   [0,'Hi {name}, have you finished your part of the group report yet?','嗨{nameCn}，小组报告你那部分写完了吗？'],
   [1,'Almost done. I just need to double-check the data one more time.','快完成了，我只需要再核对一遍数据。'],
   [0,'Great. Our teacher said the deadline is this {day}, right?','太好了。老师说截止日期是这{dayCn}，对吧？'],
   [1,'Yes, before noon. We really should meet before that.','对，中午之前。我们最好在那之前碰个头。'],
   [0,'Agreed. Should we get together {time} to put everything together?','同意。我们{timeCn}聚一下，把内容整合起来？'],
   [1,'{timeCn} works for me. Where should we meet this time?','我{timeCn}有空。这次在哪见面？'],
   [0,'How about {placeCn}? It is quieter and has power sockets.','{placeCn}怎么样？更安静，还有电源插座。'],
   [1,'Good idea. I will bring my laptop and the printed charts.','好主意。我带笔记本电脑和打印好的图表。'],
   [0,'Perfect. I can handle the introduction and the conclusion parts.','完美。我来负责引言和结论部分。'],
   [1,'Then I will take the data analysis and the recommendations.','那我负责数据分析和建议部分。'],
   [0,'Sounds like a fair split. How long do you need for your sections?','听起来分配很公平。你的部分需要多久？'],
   [1,'About an hour, maybe ninety minutes if the printer is slow again.','大概一小时，要是打印机再变慢可能要九十分钟。'],
   [0,'Let us plan for two hours, just to be safe.','那我们计划两个小时，保险一点。'],
   [1,'Fine by me. Should we invite {name2} to review the final draft?','我没意见。要不要请{name2Cn}审一遍终稿？'],
   [0,'Definitely. Four eyes are better than two, as my mom always says.','当然。我妈常说，两双眼睛总比一双强。'],
   [1,'Ha! Then I will send her a message tonight about the plan.','哈！那我今晚就把计划发消息告诉她。'],
   [0,'Great. So we are all set for {timeCn} at {placeCn}.','太好了。那我们{timeCn}{placeCn}见，都定好了。'],
   [1,'All set. See you there, and do not forget the charts!','都定好了。到时见，别忘了带图表！']],
  slots:{name:[['Emma','艾玛'],['Jake','杰克'],['Lucas','卢卡斯'],['Mia','米娅']],
         name2:[['Chloe','克洛伊'],['Owen','欧文'],['Lily','莉莉'],['Ryan','瑞恩']],
         time:[['on Friday afternoon','周五下午'],['tomorrow morning','明天早上'],['at six this evening','今晚六点']],
         day:[['Friday','周五'],['Saturday','周六'],['Sunday','周日']],
         place:[['in the study room','在自习室'],['at the coffee shop','在咖啡店'],['in the library annex','在图书馆附楼']]}},
 {icon:'🩺', name:'医生预约', roles:['前台','病人'],
  lines:[
   [0,'Good afternoon. How can I help you today?','下午好，今天有什么能帮您？'],
   [1,'I would like to see a doctor about this headache.','我想看医生，我头疼。'],
   [0,'I am sorry to hear that. How long have you had it?','很遗憾听你这么说。疼了多久了？'],
   [1,'For about three days now, mostly in the evenings after work.','大概三天了，主要在下班后的晚上。'],
   [0,'I see. Have you taken anything for the pain?','了解。吃过止痛药吗？'],
   [1,'Just some regular painkillers, but they do not help much.','只吃过普通止痛药，但效果不大。'],
   [0,'Understood. The doctor can see you at {time}. Does that work for you?','明白了。医生{timeCn}可以接诊，这个时间合适吗？'],
   [1,'{timeCn} is fine. What should I bring with me?','{timeCn}可以。我需要带什么吗？'],
   [0,'Just your ID card and your insurance papers, nothing else.','带身份证和保险单就行，其他不需要。'],
   [1,'Got it. Also, how long will the appointment take?','知道了。另外，就诊大概要多久？'],
   [0,'Usually about twenty minutes, including a short check-up.','通常二十分钟左右，包括简单检查。'],
   [1,'That is fine. Should I come early to fill in any forms?','可以。我需要提前到填表格吗？'],
   [0,'Yes, please arrive ten minutes early and register at the front desk.','是的，请提前十分钟到，在前台挂号。'],
   [1,'Ten minutes early, register at the front desk. Anything else?','提前十分钟，前台挂号。还有别的吗？'],
   [0,'That is all. Drink some water and avoid screens before you come.','就这些。来之前多喝水，少看屏幕。'],
   [1,'Avoid screens — that might be exactly why my head hurts!','少看屏幕——这可能正是我头疼的原因！'],
   [0,'Ha, quite possible. We will see what the doctor says at {timeCn}.','哈，很有可能。{timeCn}听医生怎么说吧。'],
   [1,'Thank you very much. See you this afternoon.','非常感谢，下午见。']],
  slots:{time:[['three o\'clock','三点'],['half past four','四点半'],['five o\'clock','五点']]}},
 {icon:'✈️', name:'机场值机', roles:['地勤','乘客'],
  lines:[
   [0,'Good morning. Where are you flying to today?','早上好，您今天飞往哪里？'],
   [1,'To {city}. I am visiting my sister for the holidays.','去{cityCn}，我假期去看我姐姐。'],
   [0,'How lovely. May I see your passport and ticket, please?','真好。请出示您的护照和机票。'],
   [1,'Here you are. Is the flight leaving on time today?','给您。今天航班准点吗？'],
   [0,'Yes, boarding starts at {time} at gate {gate}.','准点，{timeCn}开始在{gateCn}登机。'],
   [1,'Gate {gateCn} at {timeCn}. And how long is the flight?','{gateCn}、{timeCn}。飞行要多久？'],
   [0,'About {hours}, depending on the wind.','大约{hoursCn}，视风向而定。'],
   [1,'Not bad at all. Could I get a window seat, please?','那还不错。能给我一个靠窗的座位吗？'],
   [0,'Let me check… yes, there is a window seat in row fifteen.','我查一下……有，十五排有一个靠窗座位。'],
   [1,'Row fifteen sounds perfect. How many bags can I check in?','十五排太好了。我可以托运几件行李？'],
   [0,'One large bag and one carry-on are included in your ticket.','您的票价包含一件大行李和一件手提行李。'],
   [1,'Great, that is exactly what I have. Do I pay extra for the suitcase?','太好了，我正好就这些。行李箱要额外收费吗？'],
   [0,'Not at all, it is within the weight limit.','不用，在重量限制之内。'],
   [1,'Wonderful. Where do I go after the security check?','太好了。安检之后我去哪里？'],
   [0,'Straight ahead, then follow the signs to gate {gateCn}.','直走，然后跟着{gateCn}的指示牌走。'],
   [1,'Follow the signs to gate {gateCn}. Is there a coffee shop nearby?','跟着{gateCn}指示牌走。附近有咖啡店吗？'],
   [0,'Yes, two of them, right next to the boarding area.','有，两家，就在登机口旁边。'],
   [1,'Perfect. Thanks for your help, and have a nice day!','太好了。谢谢你的帮助，祝你今天愉快！']],
  slots:{city:[['London','伦敦'],['Sydney','悉尼'],['New York','纽约']],
         time:[['nine forty','九点四十'],['ten thirty','十点半'],['eleven fifteen','十一点十五']],
         gate:[['Gate 12','12号登机口'],['Gate 18','18号登机口'],['Gate 24','24号登机口']],
         hours:[['nine hours','九小时'],['eleven hours','十一小时'],['twelve hours','十二小时']]}},
];
const SR_OK=('webkitSpeechRecognition' in window)||('SpeechRecognition' in window);
let spk=null;

function showSpeak(){
  stopTts(); showOnly('speak');
  const noSR=document.getElementById('spNoSR');
  if(noSR) noSR.style.display = SR_OK ? 'none' : 'block';
  if(spk && spk.dialog){ renderSpeak(); } else { newDialog(); }
  window.scrollTo(0,0);
}
function getDialogSeen(){ try{ return JSON.parse(localStorage.getItem('yt_dseen')||'[]'); }catch(e){ return []; } }
function pushDialogSeen(sig){ var s=getDialogSeen(); s.push(sig); if(s.length>40) s=s.slice(-40); try{ localStorage.setItem('yt_dseen', JSON.stringify(s)); }catch(e){} }
async function newDialog(autoStart){
  if(AI_MODE && AI_BUSY){ showToast('有 AI 任务进行中，直接用本地对话'); }
  if(AI_MODE && !AI_BUSY){
    AI_BUSY=true; aiLoadingShow('🌐 AI 生成对话');
    var d=null;
    try{ d=await aiBuildDialog(); }catch(e){}
    if(d){ aiLoadingDone(true); await aiLoadingWait(1300); aiLoadingHide(); showToast('✅ AI 生成成功'); }
    else{ aiLoadingDone(false,'已改用本地生成'); await aiLoadingWait(1300); aiLoadingHide(); showToast('❌ AI 生成失败，已改用本地生成'); }
    if(d){
      aiHistPush('talk', d.name+'：'+d.lines[0].en);
      spk={dialog:{icon:'🤖',name:d.name,lines:d.lines}, cur:0, listening:false, paused:false,
           state: autoStart?'practice':'idle', grades:{}, win:null, autoT:null, tick:null, recog:null, stream:null, heardAll:'',
           mediaRec:null, chunks:[], recUrl:null, heard:'', t0:0};
      renderSpeak();
      if(autoStart) startLine(0);
      return;
    }
    showToast('❌ AI 生成失败，已改用本地生成');
  }
  const last=localStorage.getItem('yt_dlast')||'';
  let pool=SCENES.filter(function(x){ return x.name!==last; });
  if(!pool.length) pool=SCENES;
  const sc=pool[Math.floor(Math.random()*pool.length)];
  let slots={}, sig='', lines=null;
  const seen=getDialogSeen();
  for(let t=0;t<12;t++){
    slots={};
    Object.keys(sc.slots).forEach(function(k){ slots[k]=pick(sc.slots[k]); });
    if(slots.name2 && slots.name[0]===slots.name2[0]){
      const alt=sc.slots.name.filter(function(x){ return x[0]!==slots.name[0]; });
      if(alt.length) slots.name2=pick(alt);
    }
    lines=sc.lines.map(function(L){
      return {who:sc.roles[L[0]], en:fillSlots(L[1],slots), cn:fillSlots(L[2],slots)};
    });
    sig=lines.map(function(L){ return L.en; }).join('|');
    if(seen.indexOf(sig)<0 || t===11) break;
  }
  pushDialogSeen(sig);
  try{ localStorage.setItem('yt_dlast', sc.name); }catch(e){}
  spk={dialog:{icon:sc.icon,name:sc.name,lines:lines}, cur:0, listening:false, paused:false,
       state: autoStart?'practice':'idle', grades:{}, win:null, autoT:null, tick:null, recog:null, stream:null, heardAll:'',
       mediaRec:null, chunks:[], recUrl:null, heard:'', t0:0};
  renderSpeak();
  if(autoStart) startLine(0);
}
function renderSpeak(){
  const d=spk.dialog;
  $('#spScene').textContent=d.icon+' '+d.name;
  const L=d.lines[spk.cur], g=spk.grades[spk.cur];
  $('#spCurWho').textContent=L.who;
  $('#spCurNo').textContent='第 '+(spk.cur+1)+' / '+d.lines.length+' 句';
  let enHtml=gmEsc(L.en);
  if(g){ enHtml=gmEsc(L.en).split(' ').map(function(w,i){ return '<span class="w-'+g.colors[i]+'">'+w+'</span>'; }).join(' '); }
  $('#spCurEn').innerHTML=enHtml;
  $('#spCurCn').textContent=L.cn;
  let bar=0, timeTxt='—';
  if(spk.listening){ bar=spk.win.left/spk.win.limit*100; timeTxt=Math.ceil(spk.win.left)+'s'; }
  else if(g){ bar=100; timeTxt='已读完'; }
  $('#spTimeBar').style.width=bar+'%';
  $('#spTime').textContent=timeTxt;
  const box=$('#spDialog'); box.innerHTML='';
  d.lines.forEach(function(L2,li){
    const g2=spk.grades[li];
    let en2=gmEsc(L2.en);
    if(g2){ en2=gmEsc(L2.en).split(' ').map(function(w,i){ return '<span class="w-'+g2.colors[i]+'">'+w+'</span>'; }).join(' '); }
    const div=document.createElement('div');
    div.className='dl'+(li===spk.cur&&spk.listening?' cur':'')+(g2?' done':'');
    div.innerHTML='<span class="who">'+gmEsc(L2.who)+'</span><p class="en">'+en2+'</p><p class="cn">'+gmEsc(L2.cn)+'</p>'+
      (g2?'<span class="dlpct '+pctCls(g2.pct)+'">'+g2.pct+'%</span>':'')+
      (li===spk.cur&&spk.listening?'<span class="dlcur">🎙 朗读中</span>':'');
    div.onclick=function(){ jumpLine(li); };
    box.appendChild(div);
  });
  $('#spStart').style.display=(spk.state==='idle')?'block':'none';
  $('#spCtl').style.display=(spk.state==='practice')?'flex':'none';
  $('#spPauseBtn').textContent=spk.paused?'▶ 继续跟读':'⏸ 暂停';
  $('#spResult').style.display=(spk.state==='done')?'block':'none';
  $('#spNew').style.display='block';
  $('#spAgain').style.display=(spk.state==='done')?'block':'none';
  const ks=Object.keys(spk.grades).map(Number);
  const avg=ks.length?Math.round(ks.reduce(function(a,k){ return a+spk.grades[k].pct; },0)/ks.length):0;
  $('#spTotal').textContent=ks.length?('已读 '+ks.length+'/'+d.lines.length+' 句 · 当前平均 '+avg+'%'):'尚未开始朗读';
  $('#spTotalBar').style.width=(ks.length/d.lines.length*100)+'%';
}
function pctCls(p){ return p>=85?'g':(p>=60?'y':'r'); }

/* 识别与计时 */
function micStart(){
  if(spk.stream) return Promise.resolve(true);
  return navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
    spk.stream=st;
    try{
      spk.mediaRec=new MediaRecorder(st); spk.chunks=[];
      spk.mediaRec.ondataavailable=function(e){ if(e.data&&e.data.size) spk.chunks.push(e.data); };
      spk.mediaRec.start();
    }catch(e){}
    try{
      const ctx=audioCtx(); const src=ctx.createMediaStreamSource(st);
      const an=ctx.createAnalyser(); an.fftSize=512; src.connect(an);
      const arr=new Uint8Array(an.frequencyBinCount);
      (function meter(){
        if(!spk||!spk.stream) return;
        an.getByteTimeDomainData(arr);
        let peak=0; for(let i=0;i<arr.length;i++){ const v=Math.abs(arr[i]-128)/128; if(v>peak) peak=v; }
        const lm=document.getElementById('spLevel'); if(lm) lm.style.width=Math.min(100,peak*220)+'%';
        requestAnimationFrame(meter);
      })();
    }catch(e){}
    return true;
  }).catch(function(err){ showToast('无法访问麦克风：'+(err.message||err.name||'未知错误')); return false; });
}
function recogStop(){
  if(spk.recog){ try{ spk.recog.onend=null; spk.recog.onresult=null; spk.recog.stop(); }catch(e){} spk.recog=null; }
}
function beginRecog(li){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return;
  const recog=new SR();
  recog.lang='en-US'; recog.continuous=true; recog.interimResults=true;
  recog.onresult=function(e){
    let fin='',inter='';
    for(let i=0;i<e.results.length;i++){
      if(e.results[i].isFinal) fin+=e.results[i][0].transcript+' ';
      else inter+=e.results[i][0].transcript+' ';
    }
    if(fin) spk.win.finals+=fin;
    spk.win.interim=inter;
    const lv=document.getElementById('spLive');
    if(lv) lv.textContent='heard: '+(spk.win.finals+' '+inter).slice(-150);
  };
  recog.onerror=function(ev){ if(ev.error==='not-allowed') showToast('麦克风权限被拒绝，请在浏览器设置中允许'); };
  recog.onend=function(){ if(spk.listening&&!spk.paused&&spk.cur===li&&spk.recog===recog){ try{ recog.start(); }catch(e){} } };
  try{ recog.start(); }catch(e){}
  spk.recog=recog;
}
function startLine(li){
  spk.cur=li; spk.listening=true; spk.paused=false; spk.state='practice';
  const wds=normWords(spk.dialog.lines[li].en);
  /* 限时按句子长短计算：短句 4 秒起，尽量控制在 6 秒内 */
  const limit=Math.min(6, Math.max(4, Math.round(wds.length*0.55+1)));
  spk.win={words:wds, limit:limit, left:limit, finals:'', interim:''};
  delete spk.grades[li];
  micStart().then(function(){ if(spk.listening&&spk.cur===li&&!spk.paused) beginRecog(li); });
  if(spk.tick) clearInterval(spk.tick);
  spk.tick=setInterval(function(){ tickLine(li); },200);
  renderSpeak();
}
function tickLine(li){
  if(!spk.listening||spk.paused||spk.cur!==li||spk.state!=='practice') return;
  spk.win.left-=0.2;
  $('#spTimeBar').style.width=Math.max(0,spk.win.left/spk.win.limit*100)+'%';
  $('#spTime').textContent=Math.ceil(spk.win.left)+'s';
  if(spk.win.left<=0){ gradeLine(li); }
}
function editDist(a,b){
  if(Math.abs(a.length-b.length)>3) return 9;
  const m=a.length,n=b.length,dp=[];
  for(let i=0;i<=m;i++){ dp.push([i]); }
  for(let j=0;j<=n;j++){ dp[0][j]=j; }
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n];
}
function gradeLine(li){
  if(spk.listening&&spk.cur!==li) return;
  spk.listening=false;
  if(spk.tick) clearInterval(spk.tick);
  recogStop();
  const win=spk.win;
  const gotW=normWords(win.finals+' '+win.interim);
  const pairs=alignPairs(win.words,gotW);
  const colors=new Array(win.words.length).fill('r');
  const rUsed=new Array(gotW.length).fill(false);
  pairs.forEach(function(p){ colors[p[0]]='g'; rUsed[p[1]]=true; });
  for(let ti=0;ti<win.words.length;ti++){
    if(colors[ti]!=='r') continue;
    const maxEd=win.words[ti].length<=4?1:2;
    for(let ri=0;ri<gotW.length;ri++){
      if(rUsed[ri]) continue;
      if(editDist(win.words[ti],gotW[ri])<=maxEd){ colors[ti]='y'; rUsed[ri]=true; break; }
    }
  }
  let g=0,y=0;
  colors.forEach(function(c2){ if(c2==='g') g++; else if(c2==='y') y++; });
  const pct=Math.round((g+0.5*y)/win.words.length*100);
  spk.grades[li]={colors:colors,pct:pct,userText:gotW.join(' ')};
  spk.cur=li;
  renderSpeak();
  spk.autoT=setTimeout(function(){
    if(spk.state==='practice'&&spk.cur===li&&!spk.listening) advanceNext();
  },1400);
}
function advanceNext(){
  if(spk.cur+1<spk.dialog.lines.length) startLine(spk.cur+1);
  else finishSpeak();
}
function jumpLine(li){
  if(spk.state==='done') return;
  if(spk.autoT) clearTimeout(spk.autoT);
  if(spk.listening||spk.paused){ recogStop(); if(spk.tick) clearInterval(spk.tick); spk.listening=false; spk.paused=false; }
  startLine(li);
}
function finishSpeak(){
  spk.state='done'; spk.listening=false; spk.paused=false;
  if(spk.tick) clearInterval(spk.tick);
  if(spk.autoT) clearTimeout(spk.autoT);
  recogStop();
  if(spk.stream){ try{ spk.stream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){} }
  let recHtml='';
  if(spk.chunks&&spk.chunks.length&&spk.mediaRec){
    try{
      const blob=new Blob(spk.chunks,{type:spk.mediaRec.mimeType||'audio/webm'});
      if(spk.recUrl) URL.revokeObjectURL(spk.recUrl);
      spk.recUrl=URL.createObjectURL(blob);
      recHtml='<audio class="spRec" controls src="'+spk.recUrl+'"></audio>'+
              '<p style="font-size:12px;color:var(--muted);margin:6px 0 0;">↑ 回听自己的录音，对照原声找差距</p>';
    }catch(e){}
  }
  renderSpeak();
  const d=spk.dialog, ks=Object.keys(spk.grades).map(Number).sort(function(a,b){ return a-b; });
  const avg=ks.length?Math.round(ks.reduce(function(a,k){ return a+spk.grades[k].pct; },0)/ks.length):0;
  const grade= avg>=90?['优秀','g']: avg>=80?['良好','g']: avg>=70?['不错','y']: avg>=60?['及格','y']:['继续加油','r'];
  let rows='';
  d.lines.forEach(function(L,li){
    const g2=spk.grades[li];
    const cls=g2?pctCls(g2.pct):'r';
    rows+='<div class="spLine"><span class="t">'+gmEsc(L.who)+'：'+gmEsc(L.en)+'</span><span class="p '+cls+'">'+(g2?g2.pct+'%':'未读')+'</span></div>';
  });
  const box=document.getElementById('spResult');
  box.innerHTML=
    '<div class="spScore"><b>'+avg+'</b><small>综合得分 · '+grade[0]+'（已读 '+ks.length+'/'+d.lines.length+' 句）</small></div>'+
    rows+
    '<p style="font-size:12px;color:var(--muted);margin:10px 0 0;">识别文本：'+gmEsc((spk.heardAll||'（未识别到语音）').slice(0,220))+'</p>'+
    recHtml;
  box.style.display='block';
  window.scrollTo(0,0);
}
$('#spStart').onclick=function(){ if(!SR_OK){ showToast('当前浏览器不支持语音识别，无法打分'); return; } startLine(0); };
$('#spPauseBtn').onclick=function(){
  if(!spk.listening) return;
  spk.paused=!spk.paused;
  if(spk.paused){ recogStop(); } else { beginRecog(spk.cur); }
  renderSpeak();
};
$('#spReBtn').onclick=function(){ if(spk.state==='practice') startLine(spk.cur); };
$('#spDoneBtn').onclick=function(){ if(spk.listening){ gradeLine(spk.cur); } };
$('#spSkipBtn').onclick=function(){
  if(spk.autoT) clearTimeout(spk.autoT);
  if(spk.listening){ spk.listening=false; recogStop(); if(spk.tick) clearInterval(spk.tick); }
  advanceNext();
};
$('#spEndBtn').onclick=function(){ finishSpeak(); };
$('#spNew').onclick=function(){ finishSpeakSilent(); newDialog(true); };
$('#spAgain').onclick=function(){
  spk.grades={}; spk.heardAll=''; spk.state='practice';
  renderSpeak(); startLine(0);
};
$('#spBack').onclick=function(){ finishSpeakSilent(); showHome(); };
function finishSpeakSilent(){
  spk.state='idle'; spk.listening=false; spk.paused=false;
  if(spk.tick) clearInterval(spk.tick);
  if(spk.autoT) clearTimeout(spk.autoT);
  recogStop();
  if(spk.stream){ try{ spk.stream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){} }
  spk.stream=null;   /* 停止后置空，结束音量计 rAF 循环 */
}

/* 顺序对齐：目标词序列 T 与识别词序列 R 按出现顺序贪心匹配，返回逐词命中 */
function alignWords(T,R){
  const hit=new Array(T.length).fill(false);
  let j=0, matched=0;
  for(let i=0;i<T.length && j<R.length;i++){
    if(T[i]===R[j]){ hit[i]=true; matched++; j++; }
  }
  return {hit:hit, matched:matched};
}

function scoreSpeak(seconds,recUrl){
  const d=spk.dialog;
  const T=[]; d.lines.forEach(function(L,li){ normWords(L.en).forEach(function(w){ T.push({w:w,li:li}); }); });
  const R=normWords(spk.heard||'');
  const al=alignWords(T.map(function(x){ return x.w; }),R);
  const lineStat=d.lines.map(function(L,li){
    let tot=0,hit=0;
    T.forEach(function(x,ti){ if(x.li===li){ tot++; if(al.hit[ti]) hit++; } });
    return {li:li, who:L.who, en:L.en, pct: tot? Math.round(hit/tot*100):100};
  });
  const acc=al.matched/(T.length||1);
  const comp=Math.min(1,(R.length/(T.length||1)));
  const rate=R.length/Math.max(1,seconds);
  const flu=Math.max(0,1-Math.abs(rate-2.2)/1.8);
  const total=Math.round((acc*0.5+comp*0.25+flu*0.25)*100);
  const grade= total>=90?['优秀','g']: total>=80?['良好','g']: total>=70?['不错','y']: total>=60?['及格','y']:['继续加油','r'];
  const box=$('#spResult');
  let rows='';
  lineStat.forEach(function(L){
    const cls=L.pct>=85?'g':(L.pct>=60?'y':'r');
    rows+='<div class="spLine"><span class="t">'+gmEsc(L.who)+'：'+gmEsc(L.en)+'</span><span class="p '+cls+'">'+L.pct+'%</span></div>';
  });
  box.innerHTML=
    '<div class="spScore"><b>'+total+'</b><small>综合得分 · '+grade[0]+'（准确 '+Math.round(acc*100)+'% · 完整 '+Math.round(comp*100)+'% · 流利 '+Math.round(flu*100)+'%）</small></div>'+
    '<div class="spDims"><div><b>'+Math.round(acc*100)+'%</b><span>准确度</span></div>'+
    '<div><b>'+Math.round(comp*100)+'%</b><span>完整度</span></div>'+
    '<div><b>'+Math.round(flu*100)+'%</b><span>流利度</span></div></div>'+
    rows+
    '<p style="font-size:12px;color:var(--muted);margin:10px 0 0;">识别文本：'+(spk.heard||'（未识别到语音）').slice(0,200)+'</p>'+
    (recUrl?'<audio class="spRec" controls src="'+recUrl+'"></audio><p style="font-size:12px;color:var(--muted);margin:6px 0 0;">↑ 回听自己的录音，对照原声找差距</p>':'');
  box.style.display='block';
}
$('#meBtn').onclick=showProfile;
$('#meBack').onclick=showHome;

/* 提示气泡 */
let toastTimer=null;
function showToast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),1800);
}

/* ---------- 每日背词 ---------- */
const GROUP_SIZE=10;
let wGroup=[], wIdx=0, wMarks={k:0,u:0};

function getWordState(){ try{ return JSON.parse(localStorage.getItem('yt_words')||'{}'); }catch(e){ return {}; } }
function saveWordState(st){ try{ localStorage.setItem('yt_words', JSON.stringify(st)); }catch(e){} }
function markWord(w,s){
  const st=getWordState(); st[w]={s,t:Date.now()}; saveWordState(st);
  if(s==='k') wMarks.k++; else wMarks.u++;
}
/* 组词策略：标记「不认识」的词进入复习队列，优先重考（最多4个/组），
   其余名额抽新词；全部标完认识后该词退出队列 */
let WB_IDX=null;
function wordIndex(){   /* 词→行 一次性索引：已标词成百上千时避免逐词全表 find */
  if(WB_IDX) return WB_IDX;
  WB_IDX={};
  WORD_BANK.forEach(function(e){ WB_IDX[e[0]]=e; });
  return WB_IDX;
}
function pickGroup(){
  const st=getWordState();
  const picked=new Set(), group=[];
  const idx=wordIndex();
  const inFilter=(w)=>{ const e=idx[w]; return e ? wordMatchesFilter(e) : wordFilter==='all'; };
  const review=Object.entries(st)
    .filter(([,v])=>v.s==='u').sort((a,b)=>a[1].t-b[1].t)
    .map(([w])=>w).filter(inFilter);
  review.slice(0,4).forEach(w=>{
    const e=idx[w];
    if(e){ group.push(e); picked.add(w); }
  });
  const fresh=WORD_BANK.filter(function(e){ return !st[e[0]] && !picked.has(e[0]) && wordMatchesFilter(e); });
  while(group.length<GROUP_SIZE && fresh.length){
    group.push(fresh.splice(Math.floor(Math.random()*fresh.length),1)[0]);
  }
  if(group.length<GROUP_SIZE){
    const known=WORD_BANK.filter(([w])=>st[w] && st[w].s==='k' && !picked.has(w));
    while(group.length<GROUP_SIZE && known.length){
      group.push(known.splice(Math.floor(Math.random()*known.length),1)[0]);
    }
  }
  return shuffle(group).map(([w,ipa,cn,ex,exc,tag])=>({w,ipa,cn,ex,exc,tag}));
}
function wordStats(){
  const st=getWordState(); const keys=Object.keys(st);
  return {
    k: keys.filter(x=>st[x].s==='k').length,
    u: keys.filter(x=>st[x].s==='u').length
  };
}
function renderWordStats(){
  const s=wordStats();
  $('#wStats').textContent=`词库 ${WORD_BANK.length} 词 · 已掌握 ${s.k} · 待巩固 ${s.u}`;
}
async function showWords(){
  showOnly('words');
  try{ await ensureWordBank(); }catch(e){ showToast('词库加载失败，请检查网络后重试'); return; }
  applyWordFilterUI(); renderStreakChip();
  /* 发音按钮始终显示：首选有道真人音频（不依赖 speechSynthesis），离线才回落合成 */
  $('#wSpeak').style.display = '';
  startGroup();
  window.scrollTo(0,0);
}
function startGroup(){
  wGroup=pickGroup(); wIdx=0; wMarks={k:0,u:0};
  renderWord();
}
function renderWord(){
  if(wIdx>=wGroup.length){ renderGroupDone(); return; }
  const cur=wGroup[wIdx];
  $('#wCount').textContent=(wIdx+1)+' / '+wGroup.length;
  $('#wBar').style.width=(wIdx/wGroup.length*100)+'%';
  $('#wWord').textContent=cur.w;
  $('#wIpa').textContent='/'+cur.ipa+'/';
  const rec=getWordState()[cur.w];
  $('#wTag').textContent = rec ? (rec.s==='u'?'上次标记：不认识':'已掌握，偶尔复习') : '新词';
  $('#wSrc').textContent = cur.tag||'';
  $('#wSrc').style.display = cur.tag ? '' : 'none';
  $('#wMeaning').textContent=cur.cn;
  $('#wEx').textContent = cur.ex ? ('例  '+cur.ex+'\n'+cur.exc) : '';
  $('#wMeaning').classList.remove('shown');
  $('#wEx').classList.remove('shown');
  $('#wStudy').style.display='block';
  $('#wDoneBox').style.display='none';
  $('#wReveal').style.display='block';
  $('#wJudge').style.display='none';
  $('#wAgain').style.display='none';
  renderWordStats();
}
function revealWord(){
  $('#wMeaning').classList.add('shown');
  $('#wEx').classList.add('shown');
  $('#wReveal').style.display='none';
  $('#wJudge').style.display='flex';
}
function judgeWord(s){
  markWord(wGroup[wIdx].w, s);
  wIdx++;
  $('#wBar').style.width=(wIdx/wGroup.length*100)+'%';
  if(wIdx>=wGroup.length) renderGroupDone(); else renderWord();
}
function renderGroupDone(){
  $('#wCount').textContent='本轮完成';
  $('#wBar').style.width='100%';
  $('#wStudy').style.display='none';
  $('#wDoneBox').style.display='block';
  $('#wDoneSub').innerHTML=
    `共 ${wGroup.length} 词 · 标记认识 <b>${wMarks.k}</b> · 不认识 <b>${wMarks.u}</b><br>`+
    `标「不认识」的词之后会更早再次出现`;
  $('#wReveal').style.display='none';
  $('#wJudge').style.display='none';
  $('#wAgain').style.display='block';
  renderWordStats();
}
/* ---------- 语音：通用 ---------- */
const TTS_OK = ('speechSynthesis' in window);
let VOICE=null;
function pickVoice(){
  if(!TTS_OK) return;
  const vs=speechSynthesis.getVoices();
  VOICE = vs.find(v=>/^en([-_]US)?$/i.test(v.lang)) || vs.find(v=>/^en/i.test(v.lang)) || null;
}
if(TTS_OK){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }

/* ---------- 单词发音（右上角喇叭；有道真人标准美音，离线自动回落浏览器合成） ---------- */
let wSpeaking=false;
var wAudio=new Audio();
function speakWordTts(word){
  if(!TTS_OK) return;
  const u=new SpeechSynthesisUtterance(word);
  if(VOICE) u.voice=VOICE;
  u.lang='en-US'; u.rate=Math.max(0.5, 0.8*ttsRate);
  u.onstart=()=>{ wSpeaking=true; $('#wSpeak').textContent='⏹'; };
  u.onend=u.onerror=()=>{ wSpeaking=false; $('#wSpeak').textContent='🔊'; };
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function speakWord(){
  /* 朗读中再点 = 停止 */
  if(wSpeaking){
    try{ wAudio.pause(); }catch(e){}
    if(TTS_OK) speechSynthesis.cancel();
    wSpeaking=false; $('#wSpeak').textContent='🔊';
    return;
  }
  const word=($('#wWord').textContent||'').trim();
  if(!word) return;
  const done=function(){ wSpeaking=false; $('#wSpeak').textContent='🔊'; };
  wSpeaking=true; $('#wSpeak').textContent='⏹';
  /* 首选：有道词典真人发音（type=2 美音）；加载失败/离线时回落本地合成语音 */
  wAudio.onended=done;
  wAudio.onerror=function(){ done(); speakWordTts(word); };
  wAudio.src='https://dict.youdao.com/dictvoice?type=2&audio='+encodeURIComponent(word);
  wAudio.play().catch(function(){ done(); speakWordTts(word); });
}

/* ---------- 阅读朗读：全文/暂停/停止/点段落跳转 ---------- */
let tts={session:0,para:0,si:0,playing:false,paused:false};

function ttsHighlight(){
  document.querySelectorAll('#article .para').forEach((el,i)=>
    el.classList.toggle('tts-on', tts.playing && !tts.paused && i===tts.para));
}
function ttsScroll(){
  const els=document.querySelectorAll('#article .para');
  if(els[tts.para]) els[tts.para].scrollIntoView({block:'center',behavior:'smooth'});
}
function updateTtsUi(){
  const p=$('#ttsPlay'), s=$('#ttsStop'), st=$('#ttsStatus');
  const total = curPassage ? curPassage.paras.length : 0;
  if(!tts.playing){
    p.textContent='▶ 朗读全文'; s.disabled=true; st.textContent='';
  }else if(tts.paused){
    p.textContent='▶ 继续'; s.disabled=false;
    st.textContent=`已暂停 · 第 ${Math.min(tts.para+1,total)}/${total} 段 · 点任意段落可跳转`;
  }else{
    p.textContent='⏸ 暂停'; s.disabled=false;
    st.textContent=`朗读中 · 第 ${Math.min(tts.para+1,total)}/${total} 段`;
  }
}
function stopTts(){
  tts.session++; tts.playing=false; tts.paused=false; tts.para=0; tts.si=0;
  clearTimeout(tts.timer);
  if(TTS_OK) speechSynthesis.cancel();
  ttsHighlight(); updateTtsUi();
}
function ttsFinish(){
  tts.session++; tts.playing=false; tts.paused=false;
  ttsHighlight(); updateTtsUi();
  $('#ttsStatus').textContent='✅ 朗读完毕';
}
function speakCur(s){
  if(!TTS_OK || s!==tts.session || !tts.playing || tts.paused) return;
  const paras=curPassage.paras;
  if(tts.para>=paras.length){ ttsFinish(); return; }
  const sens=paras[tts.para].map(x=>x.en);
  if(tts.si>=sens.length){
    tts.para++; tts.si=0;
    if(tts.para>=paras.length){ ttsFinish(); return; }
    ttsHighlight(); ttsScroll();
  }
  const u=new SpeechSynthesisUtterance(sens[tts.si]);
  if(VOICE) u.voice=VOICE;
  u.lang='en-US'; u.rate=Math.max(0.5, 0.92*ttsRate);
  u.onend=()=>{ if(s!==tts.session || !tts.playing || tts.paused) return; clearTimeout(tts.timer); tts.si++; speakCur(s); };
  u.onerror=u.onend;
  /* 看门狗：部分浏览器/WebView 不触发 onend，超时后自动推进下一句，避免卡死 */
  clearTimeout(tts.timer);
  const estMs = sens[tts.si].split(/\s+/).length / 1.4 * 1000 + 2500;
  tts.timer = setTimeout(()=>{ if(s===tts.session && tts.playing && !tts.paused){ tts.si++; speakCur(s); } }, estMs);
  speechSynthesis.speak(u);
}
function startTts(fromPara){
  if(!TTS_OK){ showToast('当前浏览器不支持语音朗读'); return; }
  if(!curPassage) return;
  if(fromPara>=curPassage.paras.length) fromPara=0;
  tts.session++; tts.playing=true; tts.paused=false;
  tts.para=fromPara; tts.si=0;
  ttsHighlight(); updateTtsUi(); ttsScroll(); speakCur(tts.session);
}
$('#ttsPlay').onclick=()=>{
  if(!tts.playing){ startTts(tts.para); }
  else if(tts.paused){            /* 继续：从当前句重读，跨浏览器最稳 */
    tts.paused=false; ttsHighlight(); updateTtsUi(); speakCur(tts.session);
  }else{                          /* 暂停：记住当前位置 */
    tts.paused=true; clearTimeout(tts.timer);
    if(TTS_OK) speechSynthesis.cancel();
    ttsHighlight(); updateTtsUi();
  }
};
$('#ttsStop').onclick=()=>stopTts();
/* 朗读语速：1x → 0.8x → 1.25x 循环，记忆选择 */
var ttsRate=1;
try{ ttsRate=parseFloat(localStorage.getItem('yt_ttsrate'))||1; }catch(e){}
function applyTtsRateLabel(){
  const b=$('#ttsRate'); if(!b) return;
  b.textContent=(ttsRate===1?'1x':ttsRate+'x');
}
$('#ttsRate').onclick=()=>{
  ttsRate = (ttsRate===1) ? 0.8 : (ttsRate===0.8 ? 1.25 : 1);
  try{ localStorage.setItem('yt_ttsrate', String(ttsRate)); }catch(e){}
  applyTtsRateLabel(); showToast('朗读语速 '+ttsRate+'x');
};
applyTtsRateLabel();
$('#article').addEventListener('click', e=>{
  const p=e.target.closest('.para'); if(!p || !curPassage) return;
  const els=[...document.querySelectorAll('#article .para')];
  const i=els.indexOf(p);
  if(i>=0) startTts(i);
});
$('#wordBtn').onclick=showWords;
$('#clozeBtn').onclick=function(){ openCloze('cet4'); };
$('#speakBtn').onclick=showSpeak;
$('#wBack').onclick=showHome;
$('#wReveal').onclick=revealWord;
$('#wOk').onclick=()=>judgeWord('k');
$('#wNo').onclick=()=>judgeWord('u');
$('#wAgain').onclick=startGroup;
$('#wSpeak').onclick=speakWord;

async function generateAndShow(){
  if(AI_BUSY) return;
  if(AI_MODE){
    AI_BUSY=true; aiLoadingShow('🌐 AI 生成阅读文章');
    var ai=null;
    try{ ai=await aiBuildReading(); }catch(e){}
    if(ai){ aiLoadingDone(true); await aiLoadingWait(1300); aiLoadingHide(); showToast('✅ AI 生成成功'); }
    else{ aiLoadingDone(false,'已改用本地生成'); await aiLoadingWait(1300); aiLoadingHide(); showToast('❌ AI 生成失败，已改用本地生成'); }
    if(ai){
      var words=0; ai.paras.forEach(function(pa){ pa.forEach(function(s){ words+=s.en.split(/\s+/).length; }); });
      aiHistPush('read', ai.titleEn);
      var p={titleEn:ai.titleEn, titleCn:ai.titleCn, paras:ai.paras, wordCount:words, source:'ai',
             topicName:'AI 生成', emoji:'🤖', diff:curDiff, id:'ai'+Date.now().toString(36),
             extraWords:ai.words, qs:ai.qs||[]};
      bumpStats(words); recordHistory(p);
      renderPassage(p); showReader(); setHash('#read');
      return;
    }
    showToast('❌ AI 生成失败，已改用本地生成');
  }
  try{
    const p=buildPassage(curDiff);
    bumpStats(p.wordCount);
    recordHistory(p);
    renderPassage(p);
    showReader();
    setHash('#read');
  }catch(err){
    console.error(err);
    alert('生成出错：'+err.message);
  }
}
$('#genBtn').onclick=()=>{ readerFrom='home'; generateAndShow(); };
$('#nextBtn').onclick=generateAndShow;

/* 用 replaceState 改地址栏，不堆积历史记录，返回键行为由 JS 显式路由 */
function setHash(h){
  try{ history.replaceState(null, '', h || location.pathname); }catch(e){}
}

$('#backBtn').onclick=()=>{
  setHash('');
  if(readerFrom==='profile') showProfile(); else showHome();
};

/* 字号 */
const FS_STEPS=[17,19,21];
let fsIdx=0;
$('#fsBtn').onclick=()=>{
  fsIdx=(fsIdx+1)%FS_STEPS.length;
  document.documentElement.style.setProperty('--fs', FS_STEPS[fsIdx]+'px');
  saveSettings();
};

/* 主题：亮色 / 深色 / 跟随系统（三态循环，记忆选择） */
function ytThemeMode(){ try{ return localStorage.getItem('yt_theme')||'auto'; }catch(e){ return 'auto'; } }
function resolveTheme(){
  const m=ytThemeMode();
  if(m==='auto'){
    try{ return (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; }
    catch(e){ return 'light'; }
  }
  return m;
}
function applyTheme(){
  document.documentElement.dataset.theme = resolveTheme()==='dark' ? 'dark' : '';
  applyThemeIcon();
}
function applyThemeIcon(){
  const m=ytThemeMode();
  const btn=$('#themeBtn');
  btn.textContent = m==='auto' ? '🖥️' : (resolveTheme()==='dark' ? '☀️' : '🌙');
  btn.title = m==='auto' ? '主题：跟随系统' : (m==='dark' ? '主题：深色' : '主题：浅色');
}
$('#themeBtn').onclick=()=>{
  const order=['auto','light','dark'];
  const next=order[(order.indexOf(ytThemeMode())+1)%3];
  try{ localStorage.setItem('yt_theme', next); }catch(e){}
  applyTheme(); saveSettings();
  showToast(next==='auto'
    ? ('已跟随系统（当前'+(resolveTheme()==='dark'?'深色':'浅色')+'）')
    : (next==='dark' ? '已切换深色模式' : '已切换浅色模式'));
};
try{
  if(window.matchMedia){
    const mq=matchMedia('(prefers-color-scheme: dark)');
    const onSys=function(){ if(ytThemeMode()==='auto') applyTheme(); };
    mq.addEventListener ? mq.addEventListener('change', onSys) : mq.addListener(onSys);
  }
}catch(e){}

/* PWA 离线缓存（HTTPS/本地环境下注册；手机局域网 HTTP 环境自动跳过） */
if('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1'].indexOf(location.hostname)>=0)){
  navigator.serviceWorker.register('./sw.js').catch(function(){});
}

/* ---------- 安装到手机桌面（引导面板 + 我的手动入口共用） ---------- */
var ytPwa={deferred:null,waiting:false,noNative:false};
function pwaIsStandalone(){
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone===true;
}
/* 是否运行在研途阅读 APK（独立 WebView 壳）内：是则不再提示安装 */
function pwaInApk(){
  return /YantuApk/i.test(navigator.userAgent);
}
function pwaIsIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
}
/* 立即弹系统安装框（有原生事件时）；成功弹出返回 true（失败保留事件以便重试） */
function pwaPromptNow(){
  if(!ytPwa.deferred) return false;
  try{ ytPwa.deferred.prompt(); }
  catch(e){ return false; }
  var d=ytPwa.deferred; ytPwa.deferred=null;
  d.userChoice.then(function(){ ytPwa.waiting=false; }).catch(function(){ ytPwa.waiting=false; });
  return true;
}
/* 恢复按钮文案（等待超时/未支持时） */
function pwaWaitReset(){
  var btn=document.getElementById('pwaInstallBtn');
  if(btn && !btn.disabled){ btn.textContent='📲 安装到手机桌面'; }
}
/* 统一安装动作：点一下 → 直接弹系统安装框，全程无需手动操作浏览器菜单 */
function pwaInstallAction(){
  if(pwaIsStandalone()||pwaInApk()) return;
  /* 原生事件已就绪（Chrome/Edge 等）：立刻弹出安装框 */
  if(pwaPromptNow()){ pwaWaitReset(); return; }
  /* 已确认无自动安装能力（手机自带浏览器/微信等）：直接给指引，不等待 */
  if(ytPwa.noNative){ pwaGuideFallback(); return; }
  /* 事件不确定是否到达：按钮短暂显示"正在准备安装…"，事件一到自动弹出 */
  var btn=document.getElementById('pwaInstallBtn');
  ytPwa.waiting=true;
  if(btn){ btn.textContent='正在准备安装…'; }
  var waited=0;
  var iv=setInterval(function(){
    waited+=300;
    if(pwaPromptNow()){
      clearInterval(iv);
      ytPwa.waiting=false;
      pwaWaitReset();
      return;
    }
    if(waited>=5000){
      clearInterval(iv);
      ytPwa.waiting=false;
      pwaWaitReset();
      pwaGuideFallback();
    }
  },300);
}
/* 无一键安装能力时：安卓直接下载 APK 安装包，iOS 给引导 */
function pwaGuideFallback(){
  var ua=navigator.userAgent;
  if(pwaIsIOS()){
    showToast('iPhone：点 Safari 底部「分享」按钮 → 选择「添加到主屏幕」');
    return;
  }
  if(/MicroMessenger/i.test(ua)){
    showToast('微信内不支持下载：点右上角 ⋯ → 「在浏览器打开」后再安装');
    return;
  }
  /* 安卓自带浏览器等：直接下载 APK，浏览器会进入「我的下载」 */
  try{
    var a=document.createElement('a');
    a.href='https://github.com/cxjcom/yantu-reading/releases/download/v1.0/kaoyan-reading.apk';
    a.download='kaoyan-reading.apk';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('⬇️ 安装包已开始下载：到浏览器「我的下载」中打开安装（首次安装需允许「安装未知应用」）');
  }catch(e){
    showToast('下载未开始：请点菜单（☰/⋮）→「添加到桌面」，或在浏览器地址栏访问 /kaoyan-reading.apk');
  }
}
function pwaMarkInstalled(){
  var btn=document.getElementById('pwaInstallBtn');
  if(btn){ btn.textContent='✅ 已安装到桌面'; btn.disabled=true; btn.style.opacity='.6'; }
}
/* 捕获原生安装事件（安卓 Chrome/Edge）：到达即缓存；若用户已点"安装"在等待，立刻自动弹出 */
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault();
  ytPwa.deferred=e;
  ytPwa.noNative=false;
  if(pwaIsStandalone()){ pwaMarkInstalled(); return; }
});
window.addEventListener('appinstalled', function(){
  pwaMarkInstalled();
  showToast('✅ 已安装到手机桌面');
});
(function(){
  var btn=document.getElementById('pwaInstallBtn');
  if(btn) btn.addEventListener('click', pwaInstallAction);
  if(pwaIsStandalone()||pwaInApk()) pwaMarkInstalled();
})();

/* ---------- 引导面板已移除 ---------- */

/* 初始化 */
loadSettings();
renderTopicChips();
aiCfgFill();
applyTheme();
updateMeBtn();
[...$('#diffSeg').children].forEach(x=>x.classList.toggle('on', x.dataset.v===curDiff));
applyMode();
validateAll();

/* 刷新恢复：地址栏 #read 且 sessionStorage 有当前文章 → 回到阅读页 */
try{
  if(location.hash==='#read'){
    const saved=sessionStorage.getItem('yt_cur');
    if(saved){
      const p=JSON.parse(saved);
      if(p && p.paras && p.paras.length){
        renderPassage(p); showReader();
        window.__ytRestoreId = p.id;   /* 供 book.js 载入后恢复上次阅读位置 */
      }
    }
  }
}catch(e){}

/* ---------- 长篇阅读 · 段落匹配（四六级真题 Section B 题型） ---------- */
let lrState=null;
let lrLevel=(function(){ try{ return localStorage.getItem('yt_lrlevel')||'cet4'; }catch(e){ return 'cet4'; } })();
const LR_LEVELS={
  cet4:{label:'四级', target:'约1000词', diff:'cet4'},
  cet6:{label:'六级', target:'约1200词', diff:'cet6'}
};
function lrPlan(diff){
  /* 基础难度计划扩展到 ~50 句（约 900-1050 词），拆成 16 个段落（A-P） */
  const seq=[['intro',3],['bg',3],['develop',4],['develop',4],['data',2],['develop',4],['develop',3],
             ['debate',4],['develop',3],['data',1],['develop',3],['debate',4],['develop',3],
             ['data',2],['debate',3],['close',3]];
  if(diff==='cet6'){ seq.splice(13,0,['develop',3],['debate',2]); }   /* 六级加量至 ~55 句 */
  return seq;
}
function showLongRead(){
  showOnly('longread');
  [...$('#lrLevelSeg').children].forEach(function(b){ b.classList.toggle('on', b.dataset.lv===lrLevel); });
  $('#lrLevel').textContent=LR_LEVELS[lrLevel].label+' · '+LR_LEVELS[lrLevel].target;
  if(lrState && lrState.level===lrLevel){ renderLR(); } else { lrGenerate(); }
}
function setLRLevel(lv){
  if(!LR_LEVELS[lv]) return;
  lrLevel=lv;
  try{ localStorage.setItem('yt_lrlevel', lv); }catch(e){}
  lrState=null;
  $('#lrLevel').textContent=LR_LEVELS[lv].label+' · '+LR_LEVELS[lv].target;
  lrGenerate();
}
async function lrGenerate(){
  if(AI_BUSY){ showToast('有 AI 任务进行中，请稍候…'); return; }
  AI_BUSY=true;   /* 此前漏设：秒数计时与重复进入防护都依赖它 */
  aiLoadingShow('🌐 AI 生成长篇阅读');
  var ai=null;
  try{ ai=await aiBuildLongRead(); }catch(e){}
  if(ai){ aiLoadingDone(true); await aiLoadingWait(1000); aiLoadingHide(); showToast('✅ AI 生成成功'); }
  else{ aiLoadingDone(false,'已改用本地生成'); await aiLoadingWait(1000); aiLoadingHide(); showToast('❌ AI 生成失败，已改用本地生成'); }
  if(ai){
    lrState={level:lrLevel, title:ai.titleEn, titleCn:ai.titleCn, paras:ai.paras, statements:ai.statements,
             answers:new Array(ai.statements.length).fill(null), submitted:false, src:'ai'};
  } else {
    try{ await ensureWordBank(); }catch(e){}
    lrState=buildLocalLR(lrLevel);
    if(lrState.statements.length<10) showToast('本文段落不足，已尽量出题');
  }
  renderLR();
  window.scrollTo(0,0);
}
/* 本地长篇阅读构造（独立函数：仿真模考复用同一数据形态） */
function buildLocalLR(lv){
  const p=buildPassage(LR_LEVELS[lv].diff, lrPlan(LR_LEVELS[lv].diff));
  const letters='ABCDEFGHIJKLMNOP'.slice(0, Math.max(12, p.paras.length)).split('');
  /* 10 个陈述句：分散取段，优先带数字的事实句 */
  const paras=p.paras; const stmts=[]; const used=new Set();
  for(let i=0; stmts.length<10 && i<paras.length; i++){
    const pi=(1+i*Math.floor(paras.length/10))%paras.length;
    if(used.has(pi)) continue;
    const sents=paras[pi].map(function(s){ return s.en; });
    let pick2=null;
    for(const s of sents){ if(numFacts(s).length){ pick2=s; break; } }
    if(!pick2){ pick2=sents.reduce(function(a,b){ return b.length>a.length?b:a; }); }
    if(pick2.length<40) continue;
    stmts.push({text:pick2, letter:letters[pi]});
    used.add(pi);
  }
  return {level:lv, title:p.titleEn, titleCn:p.titleCn,
          paras:paras.map(function(pa){ return {en:pa.map(function(s){ return s.en; }).join(' ')}; }),
          letters:letters, statements:stmts,
          answers:new Array(stmts.length).fill(null), submitted:false, src:'local'};
}
function renderLR(){
  $('#lrLevel').textContent=LR_LEVELS[lrLevel].label+' · '+LR_LEVELS[lrLevel].target;
  const pas=$('#lrPassage'); pas.innerHTML='';
  if(lrState.title){
    const t=document.createElement('p');
    t.style.cssText='font-weight:700;font-size:18px;margin:0 0 12px;font-family:var(--serif);';
    t.textContent=lrState.title;
    pas.appendChild(t);
  }
  lrState.paras.forEach(function(pa,i){
    const d=document.createElement('p'); d.className='lrPara';
    const L='ABCDEFGHIJKLMNOP'[i]||String(i+1);
    d.innerHTML='<span class="lrLetter">'+L+'</span>';
    d.appendChild(document.createTextNode(pa.en));
    if(lrState.submitted && lrState.statements.some(function(s){ return s.letter===L; })) d.classList.add('lrAnswer');
    pas.appendChild(d);
  });
  const box=$('#lrItems'); box.innerHTML='';
  lrState.statements.forEach(function(st2,i){
    const row=document.createElement('div'); row.className='lrItem';
    const t=document.createElement('div'); t.className='lrStmt';
    const n=document.createElement('b'); n.textContent=(i+1)+'. ';
    t.appendChild(n); t.appendChild(document.createTextNode(st2.text));
    row.appendChild(t);
    const sel=document.createElement('select'); sel.className='lrSel';
    sel.innerHTML='<option value="">段落…</option>'+lrState.paras.map(function(_,i2){
      const L='ABCDEFGHIJKLMNOP'[i2]||String(i2+1); return '<option value="'+L+'">'+L+'</option>';
    }).join('');
    sel.value=lrState.answers[i]||'';
    sel.disabled=lrState.submitted;
    sel.onchange=function(){ lrState.answers[i]=sel.value||null; };
    row.appendChild(sel);
    if(lrState.submitted){
      const ok=lrState.answers[i]===st2.letter;
      const res=document.createElement('div'); res.className='qRevAns '+(ok?'lrOK':'lrNO');
      res.textContent=(ok?'✓ 正确':'✗ 错误')+' · 出处段落 '+st2.letter+(st2.why?(' ｜ '+st2.why):'');
      row.appendChild(res);
    }
    box.appendChild(row);
  });
  $('#lrSubmit').style.display=lrState.submitted?'none':'block';
  $('#lrNew').style.display=lrState.submitted?'block':'none';
}
async function aiBuildLongRead(){
  const avoid=aiHist('lr');
  const spec=LR_LEVELS[lrLevel];
  const diffSpec = lrLevel==='cet6'
    ? '大学英语六级（CET-6）难度：六级核心词汇（约6000词范围）、常见学术表达'
    : '大学英语四级（CET-4）难度：词汇限于四级大纲（约4500词）范围，句式平实';
  const sys='你是大学英语四六级命题专家。只输出严格JSON对象，禁止输出任何解释、前言或markdown代码块标记。';
  const base='命制一道四六级真题 B 节"段落信息匹配"题：随机主题（科技/生态/社会/经济/教育等）写一篇'+spec.target+
    '左右的长文章，分成 12-14 个自然段（每段 3-5 句、段间有逻辑推进），词汇与句式：'+diffSpec+
    '；然后根据文章内容出 10 道段落信息匹配题：每题一个英文陈述句（对某段内容的概括或原句微调，含定位特征词），标注其出处段落下标（0 起），10 题对应 10 个不同段落；每题给中文解析。';
  const tail='输出JSON格式：{"title":"英文标题","titleCn":"中文标题","paras":[{"en":"段落英文","cn":"段落中文"}],"statements":[{"text":"英文陈述句","para":0,"why":"中文解析"}] 共10条}。'+
    (avoid.length?'本次主题与标题必须与已生成列表完全不同：'+avoid.join(' / ')+'。':'');
  for(let attempt=0; attempt<2; attempt++){
    const usr=base+(attempt===1?' 再次强调：段落必须 12 个以上、总词数达标、恰好 10 道题且出处段落互不相同。':'')+tail;
    const txt=await aiChat(sys,usr,180000);
    if(!txt) continue;
    const j=extractJSON(txt); if(!j) continue;
    const paras=(j.paras||[]).filter(function(p){ return p&&p.en&&p.en.length>=100; })
      .map(function(p){ return {en:String(p.en), cn:String(p.cn||'')}; });
    if(paras.length<12) continue;
    var wc=0; paras.forEach(function(p){ wc+=p.en.trim().split(/\s+/).length; });
    if(wc<800) continue;
    const idxMax=paras.length;
    const stmts=(j.statements||[]).filter(function(s){
      return s && s.text && Number.isInteger(Number(s.para)) && Number(s.para)>=0 && Number(s.para)<idxMax;
    }).map(function(s){
      return {text:String(s.text).trim(), letter:'ABCDEFGHIJKLMNOP'[Number(s.para)], why:String(s.why||'')};
    });
    const uniq=new Set(stmts.map(function(s){ return s.letter; }));
    if(stmts.length<10 || uniq.size<8) continue;
    return {titleEn:String(j.title||'Section B'), titleCn:String(j.titleCn||''),
            paras:paras, statements:stmts.slice(0,10), src:'ai'};
  }
  return null;
}
$('#lrSubmit').onclick=function(){
  if(!lrState) return;
  const unanswered=lrState.answers.filter(function(a){ return !a; }).length;
  if(unanswered>0 && !confirm('还有 '+unanswered+' 题未选择段落，确定提交吗？')) return;
  lrState.submitted=true;
  renderLR();
  const right=lrState.statements.filter(function(s,i2){ return lrState.answers[i2]===s.letter; }).length;
  showToast('已完成：答对 '+right+' / '+lrState.statements.length);
};
$('#lrNew').onclick=function(){ lrGenerate(); };

/* 词库后台预加载：背词 / 词义题 / 难度报告使用；不阻塞首屏渲染 */
window.addEventListener('load', function(){ setTimeout(ensureWordBank, 800); });

/* 开屏变身动画已于 v4 移除；保留 audioCtx 供跟读功能的音量表使用 */
var AC=null;
function audioCtx(){
  var C=window.AudioContext||window.webkitAudioContext;
  if(!C) return null;
  if(!AC) AC=new C();
  if(AC.state==="suspended"){ try{AC.resume();}catch(e){} }
  return AC;
}

/* ===== 开屏动画「朱砂落墨」：移除节点 + 交互跳过 =====
   CSS 已保证动画结束后自行隐藏（fill-forwards），这里只做清理与跳过 */
(function(){
  var sp=document.getElementById('splash');
  if(!sp) return;
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){ sp.remove(); return; }
  var done=false;
  function end(){ if(done) return; done=true; if(sp.parentNode) sp.parentNode.removeChild(sp); }
  function skip(){ if(done) return; done=true; sp.classList.add('spSkip'); setTimeout(end, 420); }
  sp.addEventListener('animationend', function(ev){ if(ev.animationName==='spExit') end(); });
  sp.addEventListener('click', skip);
  ['keydown','wheel','touchstart'].forEach(function(t){
    window.addEventListener(t, skip, {passive:true, once:true});
  });
  setTimeout(end, 7800); /* 兜底：动画被系统省电策略停住也能移除（长版约 7.2s） */
})();

/* =====================================================
   游戏角：🃏 词牌消消乐 / 🔤 拼词方块 / ⚡ 词力快答 / 🎯 字母救援
   词源：WORD_BANK（ensureWordBank 懒加载）按级别过滤；
   最佳成绩存 yt_games；不写背词标记、不计阅读统计
   ===================================================== */
let gmLevel='kaoyan';
try{ gmLevel=localStorage.getItem('yt_gamelevel')||'kaoyan'; }catch(e){}
let gmCur='match';
let gmPoolCache=null, gmPoolLevel='';
/* 消消乐 */
let mtPairs=null, mtOpen=[], mtMoves=0, mtFound=0, mtLock=false, mtT0=0, mtTimer=null;
/* 拼词 */
let splWords=null, splIdx=0, splScore=0, splCur=null, splAns=[], splWrong=0, splHints=0, splHintPos=[], splLock=false;
/* 快答 */
let ruScore=0, ruCombo=0, ruMaxCombo=0, ruRight=0, ruTotal=0, ruLeft=60, ruTimer=null, ruLock=false, ruCur=null;
let ruPoolCache=null, ruPoolLevel='';
/* 救援 */
let hgWords=null, hgIdx=0, hgScore=0, hgCur=null, hgGuessed=null, hgLives=6, hgSolved=0, hgDone=false;

function gmEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function gmPool(){
  if(gmPoolCache && gmPoolLevel===gmLevel) return gmPoolCache;
  gmPoolCache=WORD_BANK.filter(wordMatchesFilter);
  gmPoolLevel=gmLevel;
  return gmPoolCache;
}
/* 按约束取词，不足时用宽松约束兜底 */
function gmPick(n, ok, okLoose){
  const pool=gmPool();
  let out=pickN(pool.filter(ok), n);
  if(out.length<n && okLoose) out=pickN(pool.filter(okLoose), n);
  return out.slice(0,n);
}
/* 游戏内独立发音：不触碰背词场景的 #wSpeak 状态 */
function gmSpeak(word){
  try{
    if(!TTS_OK) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(word);
    if(VOICE) u.voice=VOICE;
    u.lang='en-US'; u.rate=Math.max(0.5, 0.8*ttsRate);
    speechSynthesis.speak(u);
  }catch(e){}
}
function gmGamesBest(){
  try{ return JSON.parse(localStorage.getItem('yt_games')||'{}'); }catch(e){ return {}; }
}
function gmSaveBest(b){ try{ localStorage.setItem('yt_games', JSON.stringify(b)); }catch(e){} }
function gmBestText(){
  const b=gmGamesBest(), parts=[];
  if(b.match){ if(b.match.moves) parts.push('消消乐 '+b.match.moves+'步/'+b.match.time+'s'); }
  if(b.spell && b.spell.score) parts.push('拼词 '+b.spell.score+'分');
  if(b.rush && b.rush.score) parts.push('快答 '+b.rush.score+'分');
  if(b.hang && b.hang.score) parts.push('救援 '+b.hang.score+'分');
  return parts.length? '🏆 '+parts.join(' · ') : '🏆 暂无纪录';
}
function gmStopAll(){
  if(ruTimer){ clearInterval(ruTimer); ruTimer=null; }
  if(mtTimer){ clearInterval(mtTimer); mtTimer=null; }
}
function gmSyncSegs(){
  [...$('#gmLevelSeg').children].forEach(b=>b.classList.toggle('on', b.dataset.v===gmLevel));
  [...$('#gameSeg').children].forEach(b=>b.classList.toggle('on', b.dataset.v===gmCur));
}
function renderGm(){
  $('#gmBest').textContent=gmBestText();
  $('#gmStats').textContent='';
  if(gmCur==='match') gmMatchReady();
  else if(gmCur==='spell') gmSpellReady();
  else if(gmCur==='rush') gmRushReady();
  else gmHangReady();
}
async function showGames(){
  stopTts(); gmStopAll();
  showOnly('games');
  try{ await ensureWordBank(); }catch(e){ showToast('词库加载失败，请检查网络后重试'); return; }
  gmSyncSegs();
  renderGm();
  window.scrollTo(0,0);
}

/* ---------- 🃏 词牌消消乐 ---------- */
function gmMatchReady(){
  $('#gmCount').textContent='';
  $('#gmStage').innerHTML=
    '<div class="wCard"><div class="wDone">🃏 词牌消消乐</div>'+
    '<p class="deskTip" style="margin:14px 0 18px;">翻开两张牌，配对「英文词 ↔ 中文释义」。<br>8 对词牌，计步数与用时，挑战最少步数！</p>'+
    '<div class="wBtns"><button class="wBtn reveal" id="gmMtStart">研墨开局 ⟶</button></div></div>';
  $('#gmMtStart').onclick=gmMatchStart;
}
function gmMatchStart(){
  const words=gmPick(8,
    r=>{ const w=r[0], cn=r[2]||''; return w.length<=12 && cn.length<=16 && w.indexOf(' ')<0; },
    r=>{ const w=r[0], cn=r[2]||''; return w.length<=16 && cn.length<=26 && w.indexOf(' ')<0; });
  if(words.length<8){ showToast('词库还在研墨中，稍候再试'); return; }
  mtPairs=words.map(r=>({w:r[0], cn:(r[2]||'').trim(), ipa:r[1]||''}));
  mtOpen=[]; mtMoves=0; mtFound=0; mtLock=false; mtT0=0;
  const cards=[];
  mtPairs.forEach((p,i)=>{ cards.push({pair:i, kind:'w', text:p.w}); cards.push({pair:i, kind:'c', text:p.cn}); });
  shuffle(cards);
  let html='<div class="gmHud"><span>步数 <b id="gmMtMoves">0</b></span><span>用时 <b id="gmMtTime">0s</b></span><span>配对 <b id="gmMtFound">0</b> / 8</span></div><div class="gmBoard" id="gmMtBoard">';
  cards.forEach((c,i)=>{
    html+='<button class="gmCard" data-i="'+i+'" data-pair="'+c.pair+'" data-kind="'+c.kind+'" aria-label="词牌">'+
      '<span class="gmInner"><span class="gmFace gmBack2">文</span><span class="gmFace gmFront">'+gmEsc(c.text)+'</span></span></button>';
  });
  html+='</div>';
  $('#gmStage').innerHTML=html;
  $('#gmStats').textContent='点两张牌配对；配错会自动翻回';
  $('#gmCount').textContent='0 / 8';
  $('#gmMtBoard').addEventListener('click', mtClick);
}
function mtClick(ev){
  const el=ev.target.closest('.gmCard');
  if(!el || mtLock || el.classList.contains('flip') || el.classList.contains('ok')) return;
  if(!mtT0){
    mtT0=Date.now();
    mtTimer=setInterval(function(){
      const t=$('#gmMtTime');
      if(t) t.textContent=Math.round((Date.now()-mtT0)/1000)+'s';
    },500);
  }
  el.classList.add('flip');
  mtOpen.push(el);
  if(mtOpen.length<2) return;
  mtMoves++;
  const mv=$('#gmMtMoves'); if(mv) mv.textContent=mtMoves;
  const a=mtOpen[0], b=mtOpen[1]; mtOpen=[];
  if(a.dataset.pair===b.dataset.pair && a.dataset.kind!==b.dataset.kind){
    mtLock=true;
    setTimeout(function(){
      a.classList.add('ok'); b.classList.add('ok');
      a.disabled=true; b.disabled=true;
      mtFound++; mtLock=false;
      const f=$('#gmMtFound'); if(f) f.textContent=mtFound;
      $('#gmCount').textContent=mtFound+' / 8';
      if(mtFound===8) mtWin();
    },380);
  }else{
    mtLock=true;
    b.classList.add('bad');
    setTimeout(function(){
      a.classList.remove('flip','bad'); b.classList.remove('flip','bad');
      mtLock=false;
    },720);
  }
}
function mtWin(){
  gmStopAll();
  const secs=Math.round((Date.now()-mtT0)/1000);
  const b=gmGamesBest(), mb=b.match||{}, rec=[];
  if(!mb.moves || mtMoves<mb.moves){ mb.moves=mtMoves; rec.push('最少步数'); }
  if(!mb.time || secs<mb.time){ mb.time=secs; rec.push('最快用时'); }
  if(rec.length){ b.match=mb; gmSaveBest(b); $('#gmBest').textContent=gmBestText(); }
  const recap=mtPairs.map(p=>'<li><b>'+gmEsc(p.w)+'</b><i>/'+gmEsc(p.ipa)+'/</i><span>'+gmEsc(p.cn)+'</span></li>').join('');
  $('#gmStage').innerHTML=
    '<div class="wCard"><div class="wDone">🎉 全部配对！</div>'+
    '<div class="wDoneSub">用时 '+secs+' 秒 · '+mtMoves+' 步'+(rec.length?(' · 🏆 新纪录（'+rec.join('、')+'）'):'')+'</div>'+
    '<div class="inkLabel">本局词牌复盘</div><ul class="gmRecap">'+recap+'</ul>'+
    '<div class="wBtns"><button class="wBtn again" id="gmMtAgain">🔁 再来一局</button></div></div>';
  $('#gmStats').textContent=''; $('#gmCount').textContent='';
  $('#gmMtAgain').onclick=gmMatchStart;
  showToast(rec.length? '🏆 新纪录！':'太棒了，再来一局？');
}

/* ---------- 🔤 拼词方块 ---------- */
function gmSpellReady(){
  $('#gmCount').textContent='';
  const b=gmGamesBest();
  $('#gmStage').innerHTML=
    '<div class="wCard"><div class="wDone">🔤 拼词方块</div>'+
    '<p class="deskTip" style="margin:14px 0 18px;">看中文释义、听发音，用乱序字母块拼出单词。10 词一轮。<br>「提示」补一个字母 -2 分；整词拼错重来 -1 分。</p>'+
    (b.spell&&b.spell.score?('<p class="gmBest2">🏆 最高分 '+b.spell.score+'</p>'):'')+
    '<div class="wBtns"><button class="wBtn reveal" id="gmSpStart">提笔开拼 ⟶</button></div></div>';
  $('#gmSpStart').onclick=gmSpellStart;
}
function gmSpellStart(){
  splWords=gmPick(10,
    r=>{ const w=r[0]; return w.length>=4 && w.length<=12 && /^[a-z]+$/.test(w) && (r[2]||'').length>0; },
    r=>{ const w=r[0]; return w.length>=3 && w.length<=14 && /^[a-z]+$/.test(w) && (r[2]||'').length>0; });
  if(splWords.length<10){ showToast('词库还在研墨中，稍候再试'); return; }
  splIdx=0; splScore=0;
  gmSpellWord();
}
function gmSpellWord(){
  if(splIdx>=10){ gmSpellEnd(); return; }
  const r=splWords[splIdx];
  splCur={w:r[0], ipa:r[1]||'', cn:(r[2]||'').trim(), ex:r[3]||'', exc:r[4]||''};
  splAns=new Array(splCur.w.length).fill(null);
  splWrong=0; splHints=0; splHintPos=[]; splLock=false;
  const letters=shuffle(splCur.w.split(''));
  let tiles='';
  letters.forEach((ch,i)=>{ tiles+='<button class="gmTile" data-ch="'+ch+'" data-ti="'+i+'">'+ch.toUpperCase()+'</button>'; });
  let slots='';
  splCur.w.split('').forEach((_,i)=>{ slots+='<button class="gmSlot" data-si="'+i+'">_</button>'; });
  $('#gmStage').innerHTML=
    '<div class="gmHud"><span>进度 <b>'+(splIdx+1)+' / 10</b></span><span>得分 <b id="gmSpScore">'+splScore+'</b></span></div>'+
    '<div class="wCard" style="padding:22px 16px 26px; position:relative;">'+
      '<button class="inkBtn wSpeak" id="gmSpHear" title="听发音">🔊</button>'+
      '<div class="gmHint2">'+gmEsc(splCur.cn)+'</div>'+
      '<div class="wIpaRow"><span class="wIpa">/'+gmEsc(splCur.ipa)+'/</span></div>'+
      '<div class="gmSlots" id="gmSpSlots">'+slots+'</div>'+
      '<div class="gmTiles" id="gmSpTiles">'+tiles+'</div>'+
      '<div class="gmOps"><button class="inkBtn" id="gmSpHint">💡 提示 -2</button><span class="gmWarn" id="gmSpMsg"></span></div>'+
      '<div class="gmDetail" id="gmSpDetail"></div>'+
    '</div>'+
    '<div class="wBtns" id="gmSpNextRow" style="display:none"><button class="wBtn reveal" id="gmSpNext">下一题 ⟶</button></div>';
  $('#gmStats').textContent='点字母块填入 → 点已填槽位取回';
  $('#gmCount').textContent='第 '+(splIdx+1)+' 词';
  $('#gmSpTiles').addEventListener('click', splTileClick);
  $('#gmSpSlots').addEventListener('click', splSlotClick);
  $('#gmSpHint').onclick=splHint;
  $('#gmSpHear').onclick=function(){ gmSpeak(splCur.w); };
  $('#gmSpNext').onclick=function(){ splLock=false; splIdx++; gmSpellWord(); };
  setTimeout(function(){ gmSpeak(splCur.w); },250);
}
function splTileClick(ev){
  const t=ev.target.closest('.gmTile');
  if(!t || splLock || t.classList.contains('used')) return;
  const si=splAns.indexOf(null);
  if(si<0) return;
  splAns[si]={ch:t.dataset.ch, ti:+t.dataset.ti};
  t.classList.add('used');
  const slot=$('#gmSpSlots').children[si];
  slot.textContent=t.dataset.ch.toUpperCase();
  slot.classList.add('filled');
  $('#gmSpMsg').textContent='';
  if(splAns.every(x=>x)) splJudge();
}
function splSlotClick(ev){
  const s=ev.target.closest('.gmSlot');
  if(!s || splLock || !s.classList.contains('filled') || s.classList.contains('hinted')) return;
  const si=[...$('#gmSpSlots').children].indexOf(s);
  const v=splAns[si];
  if(!v) return;
  splAns[si]=null;
  s.textContent='_'; s.classList.remove('filled');
  const tile=$('#gmSpTiles').querySelector('.gmTile[data-ti="'+v.ti+'"]');
  if(tile) tile.classList.remove('used');
}
function splJudge(){
  const word=splAns.map(x=>x.ch).join('');
  if(word===splCur.w){ splRight(); return; }
  splWrong++;
  splScore=Math.max(0, splScore-1);
  const sc=$('#gmSpScore'); if(sc) sc.textContent=splScore;
  $('#gmSpMsg').textContent='拼错了，再试试（-1 分）';
  const sl=$('#gmSpSlots');
  sl.classList.add('gmShake');
  setTimeout(function(){ sl.classList.remove('gmShake'); splReset(); },480);
}
/* 拼错重来：保留已提示的字母，清掉普通字母 */
function splReset(){
  const keep={};
  splHintPos.forEach(function(i){ keep[i]=splCur.w[i]; });
  splAns=new Array(splCur.w.length).fill(null);
  [...$('#gmSpTiles').querySelectorAll('.gmTile')].forEach(t=>t.classList.remove('used'));
  [...$('#gmSpSlots').children].forEach(function(s,i){
    if(keep[i]!==undefined){
      splAns[i]={ch:keep[i], ti:-1};
      s.textContent=keep[i].toUpperCase();
      s.classList.add('filled','hinted');
      const t=[...$('#gmSpTiles').querySelectorAll('.gmTile')].find(x=>x.dataset.ch===keep[i] && !x.classList.contains('used'));
      if(t) t.classList.add('used');
    }else{
      s.textContent='_'; s.classList.remove('filled','hinted');
    }
  });
}
function splHint(){
  if(splLock) return;
  let si=-1;
  for(let i=0;i<splAns.length;i++){
    if(!splAns[i] || splAns[i].ch!==splCur.w[i]){ si=i; break; }
  }
  if(si<0) return;
  const need=splCur.w[si];
  /* 该字母若已占用在别的槽位，先取回 */
  for(let i=0;i<splAns.length;i++){
    if(splAns[i] && splAns[i].ch===need && i!==si && !splHintPos.includes(i)){
      const tile=$('#gmSpTiles').querySelector('.gmTile[data-ti="'+splAns[i].ti+'"]');
      if(tile) tile.classList.remove('used');
      splAns[i]=null;
      const s=$('#gmSpSlots').children[i];
      s.textContent='_'; s.classList.remove('filled');
    }
  }
  const tile=[...$('#gmSpTiles').querySelectorAll('.gmTile')].find(x=>x.dataset.ch===need && !x.classList.contains('used'));
  if(tile) tile.classList.add('used');
  splAns[si]={ch:need, ti:tile? +tile.dataset.ti : -1};
  const slot=$('#gmSpSlots').children[si];
  slot.textContent=need.toUpperCase();
  slot.classList.add('filled','hinted');
  if(!splHintPos.includes(si)) splHintPos.push(si);
  splHints++;
  splScore=Math.max(0, splScore-2);
  const sc=$('#gmSpScore'); if(sc) sc.textContent=splScore;
  if(splAns.every(x=>x)) splJudge();
}
function splRight(){
  splLock=true;
  const pts=Math.max(4, 10 - splHints*2 - splWrong);
  splScore+=pts;
  const sc=$('#gmSpScore'); if(sc) sc.textContent=splScore;
  $('#gmSpSlots').classList.add('gmWin');
  $('#gmSpMsg').textContent='';
  $('#gmSpTiles').querySelectorAll('.gmTile').forEach(t=>t.classList.add('used'));
  const det=$('#gmSpDetail');
  det.innerHTML='<b>'+gmEsc(splCur.w)+'</b><i>/'+gmEsc(splCur.ipa)+'/</i><span class="pt">+ '+pts+' 分</span>'+
    '<p>'+gmEsc(splCur.cn)+'</p>'+
    (splCur.ex?('<p class="ex">'+gmEsc(splCur.ex)+(splCur.exc?('<br>'+gmEsc(splCur.exc)):'')+'</p>'):'');
  det.classList.add('shown');
  const row=$('#gmSpNextRow'); row.style.display='flex';
  $('#gmCount').textContent='第 '+(splIdx+1)+' 词 ✓';
  $('#gmStats').textContent='';
  showToast('拼对了 +'+pts+' 分');
}
function gmSpellEnd(){
  const b=gmGamesBest(), sb=b.spell||{};
  const rec=!sb.score || splScore>sb.score;
  sb.score=Math.max(sb.score||0, splScore);
  b.spell=sb; gmSaveBest(b);
  $('#gmBest').textContent=gmBestText();
  $('#gmStage').innerHTML=
    '<div class="wCard"><div class="wDone">🎉 本轮完成</div>'+
    '<div class="wDoneSub">得分 '+splScore+' · 拼对 10 词'+(rec?' · 🏆 新纪录':'')+'</div>'+
    '<div class="wBtns"><button class="wBtn again" id="gmSpAgain">🔁 再来一轮</button></div></div>';
  $('#gmCount').textContent=''; $('#gmStats').textContent='';
  $('#gmSpAgain').onclick=gmSpellStart;
  if(rec) showToast('🏆 新纪录：'+splScore+' 分');
}

/* ---------- ⚡ 词力快答 ---------- */
function gmRushPool(){
  if(ruPoolCache && ruPoolLevel===gmLevel) return ruPoolCache;
  ruPoolCache=gmPool().filter(r=>(r[2]||'').length>=2);
  ruPoolLevel=gmLevel;
  return ruPoolCache;
}
function gmRushReady(){
  $('#gmCount').textContent='';
  gmStopAll();
  const b=gmGamesBest();
  $('#gmStage').innerHTML=
    '<div class="wCard"><div class="wDone">⚡ 词力快答</div>'+
    '<p class="deskTip" style="margin:14px 0 18px;">60 秒限时抢答：看词选释义 / 看释义选词。<br>连击越高加成越多（最高 ×5），答错连击清零。</p>'+
    (b.rush&&b.rush.score?('<p class="gmBest2">🏆 最高分 '+b.rush.score+(b.rush.combo?(' · 最大连击 ×'+b.rush.combo):'')+'</p>'):'')+
    '<div class="wBtns"><button class="wBtn reveal" id="gmRuStart">开始抢答 ⟶</button></div></div>';
  $('#gmRuStart').onclick=gmRushStart;
}
function gmRushStart(){
  ruScore=0; ruCombo=0; ruMaxCombo=0; ruRight=0; ruTotal=0; ruLeft=60; ruLock=false;
  $('#gmStage').innerHTML=
    '<div class="gmHud"><span>得分 <b id="gmRuScore">0</b></span><span class="gmCombo" id="gmRuCombo"></span><span>答对 <b id="gmRuRight">0</b></span></div>'+
    '<div class="wBarWrap" style="margin:0 2px 14px;"><div id="gmRuTimeBar"></div></div>'+
    '<div class="wCard" style="padding:22px 16px 26px; min-height:250px;" id="gmRuCard"></div>';
  $('#gmStats').textContent='手要快，心要稳！';
  $('#gmCount').textContent='60s';
  ruTimer=setInterval(function(){
    ruLeft-=0.1;
    const bar=$('#gmRuTimeBar');
    if(bar) bar.style.width=Math.max(0, ruLeft/60*100)+'%';
    const c=$('#gmCount');
    if(c) c.textContent=Math.max(0, Math.ceil(ruLeft))+'s';
    if(ruLeft<=0) gmRushEnd();
  },100);
  gmRushQ();
}
function gmRushDs(P, target, key){
  const tv=key(target), used={}, out=[];
  used[tv]=1;
  for(let guard=0; guard<200 && out.length<3; guard++){
    const c=pick(P), v=key(c);
    if(used[v]) continue;
    used[v]=1; out.push(c);
  }
  return out;
}
function gmRushQ(){
  if(ruLeft<=0) return;
  const P=gmRushPool();
  const target=pick(P);
  const toCn=Math.random()<0.6;
  let opts;
  if(toCn){
    const ds=gmRushDs(P, target, x=>x[2]);
    opts=shuffle([{t:target[2], ok:true}].concat(ds.map(d=>({t:d[2], ok:false}))));
  }else{
    const ds=gmRushDs(P, target, x=>x[0]);
    opts=shuffle([{t:target[0], ok:true}].concat(ds.map(d=>({t:d[0], ok:false}))));
  }
  ruCur={opts:opts, ans:opts.findIndex(o=>o.ok)};
  ruTotal++;
  let html='<div class="gmPrompt">'+gmEsc(target[0])+'</div><div class="gmOpts">';
  if(!toCn) html='<div class="gmPrompt gmPromptCn">'+gmEsc(target[2])+'</div><div class="gmOpts">';
  opts.forEach((o,i)=>{ html+='<button class="qOpt" data-oi="'+i+'"><b>'+String.fromCharCode(65+i)+'.</b> '+gmEsc(o.t)+'</button>'; });
  html+='</div>';
  $('#gmRuCard').innerHTML=html;
  $('#gmRuCard').querySelector('.gmOpts').addEventListener('click', ruAns);
}
function ruAns(ev){
  const b=ev.target.closest('.qOpt');
  if(!b || ruLock || ruLeft<=0) return;
  ruLock=true;
  const oi=+b.dataset.oi;
  if(oi===ruCur.ans){
    ruCombo++; ruMaxCombo=Math.max(ruMaxCombo, ruCombo);
    const pts=10+Math.min(ruCombo,5)*2;
    ruScore+=pts; ruRight++;
    b.classList.add('right');
    const sc=$('#gmRuScore'); if(sc) sc.textContent=ruScore;
    const cb=$('#gmRuCombo'); if(cb) cb.textContent=ruCombo>=2?('🔥 ×'+ruCombo):'';
    const rr=$('#gmRuRight'); if(rr) rr.textContent=ruRight;
    setTimeout(function(){ ruLock=false; gmRushQ(); },230);
  }else{
    ruCombo=0;
    b.classList.add('wrong');
    const cb=$('#gmRuCombo'); if(cb) cb.textContent='';
    const right=$('#gmRuCard').querySelector('.qOpt[data-oi="'+ruCur.ans+'"]');
    if(right) right.classList.add('right');
    setTimeout(function(){ ruLock=false; gmRushQ(); },680);
  }
}
function gmRushEnd(){
  gmStopAll();
  const acc=ruTotal? Math.round(ruRight/ruTotal*100) : 0;
  const b=gmGamesBest(), rb=b.rush||{};
  const rec=!rb.score || ruScore>rb.score;
  rb.score=Math.max(rb.score||0, ruScore);
  rb.combo=Math.max(rb.combo||0, ruMaxCombo);
  b.rush=rb; gmSaveBest(b);
  $('#gmBest').textContent=gmBestText();
  $('#gmStage').innerHTML=
    '<div class="wCard"><div class="wDone">⏰ 时间到！</div>'+
    '<div class="wDoneSub">得分 '+ruScore+' · 答对 '+ruRight+'/'+ruTotal+'（'+acc+'%）· 最大连击 ×'+ruMaxCombo+(rec?' · 🏆 新纪录':'')+'</div>'+
    '<div class="wBtns"><button class="wBtn again" id="gmRuAgain">🔁 再来一次</button></div></div>';
  $('#gmStats').textContent=''; $('#gmCount').textContent='';
  $('#gmRuAgain').onclick=gmRushStart;
  if(rec) showToast('🏆 新纪录：'+ruScore+' 分');
}

/* ---------- 🎯 字母救援 ---------- */
function gmHangReady(){
  $('#gmCount').textContent='';
  const b=gmGamesBest();
  $('#gmStage').innerHTML=
    '<div class="wCard"><div class="wDone">🎯 字母救援</div>'+
    '<p class="deskTip" style="margin:14px 0 18px;">根据释义与音标，把单词从墨困中救出来。5 词一轮，每词 6 次机会。<br>屏幕键盘或直接敲电脑键盘均可；剩余机会越多，得分越高。</p>'+
    (b.hang&&b.hang.score?('<p class="gmBest2">🏆 最高分 '+b.hang.score+'</p>'):'')+
    '<div class="wBtns"><button class="wBtn reveal" id="gmHgStart">开始救援 ⟶</button></div></div>';
  $('#gmHgStart').onclick=gmHangStart;
}
function gmHangStart(){
  hgWords=gmPick(5,
    r=>{ const w=r[0]; return w.length>=4 && w.length<=10 && /^[a-z]+$/.test(w) && (r[2]||'').length>0; },
    r=>{ const w=r[0]; return w.length>=3 && w.length<=12 && /^[a-z]+$/.test(w) && (r[2]||'').length>0; });
  if(hgWords.length<5){ showToast('词库还在研墨中，稍候再试'); return; }
  hgIdx=0; hgScore=0; hgSolved=0;
  gmHangWord();
}
function gmHangWord(){
  if(hgIdx>=5){ gmHangEnd(); return; }
  const r=hgWords[hgIdx];
  hgCur={w:r[0], ipa:r[1]||'', cn:(r[2]||'').trim()};
  hgGuessed={}; hgLives=6; hgDone=false;
  $('#gmStage').innerHTML=
    '<div class="gmHud"><span>第 <b>'+(hgIdx+1)+'</b> / 5 词</span><span>得分 <b id="gmHgScore">'+hgScore+'</b></span><span class="gmLives" id="gmHgLives">💛💛💛💛💛💛</span></div>'+
    '<div class="wCard" style="padding:22px 16px 26px;">'+
      '<div class="gmHint2">'+gmEsc(hgCur.cn)+'</div>'+
      '<div class="wIpaRow"><span class="wIpa">/'+gmEsc(hgCur.ipa)+'/</span></div>'+
      '<div class="gmSlots gmStatic" id="gmHgSlots"></div>'+
      '<div class="gmKeys" id="gmHgKeys"></div>'+
      '<div class="gmWarn" id="gmHgMsg"></div>'+
      '<div class="gmDetail" id="gmHgDetail"></div>'+
    '</div>'+
    '<div class="wBtns" id="gmHgNextRow" style="display:none"><button class="wBtn reveal" id="gmHgNext">下一个词 ⟶</button></div>';
  const sl=$('#gmHgSlots');
  hgCur.w.split('').forEach(function(){
    const d=document.createElement('span');
    d.className='gmSlot2'; d.textContent='_';
    sl.appendChild(d);
  });
  const kb=$('#gmHgKeys');
  ['qwertyuiop','asdfghjkl','zxcvbnm'].forEach(function(row){
    const div=document.createElement('div');
    div.className='gmKeyRow';
    row.split('').forEach(function(ch){
      const b=document.createElement('button');
      b.className='gmKey'; b.textContent=ch.toUpperCase(); b.dataset.ch=ch;
      div.appendChild(b);
    });
    kb.appendChild(div);
  });
  $('#gmCount').textContent='第 '+(hgIdx+1)+' 词';
  $('#gmStats').textContent='点字母或敲键盘猜词；猜错一次少一颗心';
  $('#gmHgKeys').addEventListener('click', function(ev){
    const k=ev.target.closest('.gmKey');
    if(k) hgGuess(k.dataset.ch);
  });
  $('#gmHgNext').onclick=function(){ hgIdx++; gmHangWord(); };
  setTimeout(function(){ gmSpeak(hgCur.w); },250);
}
function hgGuess(ch){
  if(!hgCur || hgDone || hgGuessed[ch]) return;
  hgGuessed[ch]=1;
  const key=$('#gmHgKeys').querySelector('.gmKey[data-ch="'+ch+'"]');
  if(key) key.classList.add('used');
  const w=hgCur.w;
  if(w.indexOf(ch)>=0){
    if(key) key.classList.add('hit');
    [...$('#gmHgSlots').children].forEach(function(s,i){
      if(w[i]===ch){ s.textContent=ch.toUpperCase(); s.classList.add('filled'); }
    });
    if([...$('#gmHgSlots').children].every(s=>s.classList.contains('filled'))) hgSolve(true);
  }else{
    if(key) key.classList.add('miss');
    hgLives--;
    const lv=$('#gmHgLives');
    if(lv) lv.textContent='💛'.repeat(Math.max(0,hgLives))+'🖤'.repeat(Math.min(6,6-hgLives));
    const msg=$('#gmHgMsg');
    if(msg) msg.textContent=hgLives>0? '没有这个字母，机会 -1' : '';
    if(hgLives<=0) hgSolve(false);
  }
}
function hgSolve(ok){
  hgDone=true;
  let pts=0;
  if(ok){
    pts=10+hgLives;
    hgScore+=pts; hgSolved++;
    const sc=$('#gmHgScore'); if(sc) sc.textContent=hgScore;
    showToast('救援成功 +'+pts+' 分');
  }else{
    showToast('这个词没救出来…');
    const msg=$('#gmHgMsg'); if(msg) msg.textContent='';
  }
  [...$('#gmHgSlots').children].forEach(function(s,i){
    s.textContent=hgCur.w[i].toUpperCase();
    s.classList.add(ok?'filled':'missed');
  });
  const det=$('#gmHgDetail');
  det.innerHTML='<b>'+gmEsc(hgCur.w)+'</b><i>/'+gmEsc(hgCur.ipa)+'/</i>'+(ok?'<span class="pt">+ '+pts+' 分</span>':'')+
    '<p>'+gmEsc(hgCur.cn)+'</p>';
  det.classList.add('shown');
  $('#gmHgKeys').querySelectorAll('.gmKey').forEach(k=>k.disabled=true);
  $('#gmHgNextRow').style.display='flex';
  $('#gmHgNext').textContent=hgIdx>=4? '查看战报 ⟶' : '下一个词 ⟶';
  $('#gmHgNext').onclick=function(){ hgIdx++; gmHangWord(); };
}
function gmHangEnd(){
  const b=gmGamesBest(), hb=b.hang||{};
  const rec=!hb.score || hgScore>hb.score;
  hb.score=Math.max(hb.score||0, hgScore);
  b.hang=hb; gmSaveBest(b);
  $('#gmBest').textContent=gmBestText();
  $('#gmStage').innerHTML=
    '<div class="wCard"><div class="wDone">'+(hgScore>0?'🎉 救援完成':'💪 再接再厉')+'</div>'+
    '<div class="wDoneSub">本轮得分 '+hgScore+' · 救出 '+hgSolved+' / 5 词'+(rec?' · 🏆 新纪录':'')+'</div>'+
    '<div class="wBtns"><button class="wBtn again" id="gmHgAgain">🔁 再来一轮</button></div></div>';
  $('#gmCount').textContent=''; $('#gmStats').textContent='';
  $('#gmHgAgain').onclick=gmHangStart;
  if(rec) showToast('🏆 新纪录：'+hgScore+' 分');
}
/* 物理键盘猜字母（仅救援进行中且游戏角可见时生效） */
document.addEventListener('keydown', function(ev){
  if(gmCur!=='hang' || !hgCur || hgDone) return;
  const sec=document.getElementById('games');
  if(!sec || sec.style.display==='none') return;
  if(ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const m=/^([a-zA-Z])$/.exec(ev.key);
  if(m) hgGuess(m[1].toLowerCase());
});

/* ---------- 游戏角绑定 ---------- */
$('#gmBack').onclick=function(){ gmStopAll(); showHome(); };
$('#gmLevelSeg').addEventListener('click', function(ev){
  const b=ev.target.closest('button');
  if(!b || b.dataset.v===gmLevel) return;
  gmLevel=b.dataset.v;
  try{ localStorage.setItem('yt_gamelevel', gmLevel); }catch(e){}
  gmPoolCache=null; ruPoolCache=null;
  gmStopAll();
  gmSyncSegs();
  renderGm();
  showToast('词库级别已切换');
});
$('#gameSeg').addEventListener('click', function(ev){
  const b=ev.target.closest('button');
  if(!b || b.dataset.v===gmCur) return;
  gmCur=b.dataset.v;
  gmStopAll();
  gmSyncSegs();
  renderGm();
});

/* =====================================================
   学习数据面板 · AI 作文批改 · 读后讨论 · 仿真模考
   ===================================================== */

/* ---------- 学习数据面板（书房页） ---------- */
function getDaily(){ try{ return JSON.parse(localStorage.getItem('yt_daily')||'{}'); }catch(e){ return {}; } }
function getWritings(){ try{ return JSON.parse(localStorage.getItem('yt_writings')||'[]'); }catch(e){ return []; } }
function saveWritings(w){ try{ localStorage.setItem('yt_writings', JSON.stringify(w.slice(0,30))); }catch(e){} }
function renderPanel(){
  const el=document.getElementById('panel'); if(!el) return;
  const st=getStats(), daily=getDaily();
  const ds=function(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  /* 每日目标卡 */
  const goal=getGoals();
  const todayKey=ds(new Date());
  const d0=daily[todayKey]||{read:0,words:0};
  const need=Number(goal.n)||1;
  const cur=Number(d0.read)||0;
  const goalDone=cur>=need;
  const goalPct=Math.min(100,Math.round(cur/need*100));
  const goalHtml=
    '<div class="glCard'+(goalDone?' glDone':'')+'">'+
      '<div class="glHead">🎯 今日目标 · 阅读 '+need+' 篇 '+(goalDone?'<span class="glDone2">✅ 已完成</span>':'<span class="glTodo">今日 '+cur+' / '+need+'</span>')+'</div>'+
      '<div class="pnBar"><i style="width:'+goalPct+'%"></i></div>'+
      '<div class="glSet">目标：<button class="glBtn'+(need===1?' on':'')+'" data-n="1">1 篇</button>'+
      '<button class="glBtn'+(need===2?' on':'')+'" data-n="2">2 篇</button>'+
      '<button class="glBtn'+(need===3?' on':'')+'" data-n="3">3 篇</button>'+
      '<button class="glBtn" id="glRemind">🔔 学习提醒：'+(goal.remind===false?'关':'开')+'</button></div>'+
    '</div>';
  const cells=[];
  for(let i=83;i>=0;i--){
    const d=new Date(Date.now()-i*86400000);
    const key=ds(d);
    const r=(daily[key]&&daily[key].read)||0;
    const lv=r>=4?4:(r>=2?3:(r>=1?2:0));
    cells.push('<i class="pnCell lv'+lv+'" title="'+key+' · '+r+' 篇"></i>');
  }
  const ws=getWordState(); let wk=0, wu=0;
  Object.keys(ws).forEach(function(k){ if(ws[k].s==='k') wk++; else wu++; });
  const wtot=wk+wu;
  const wb=getWrongBook(); const byType={};
  wb.forEach(function(x){ byType[x.type]=(byType[x.type]||0)+1; });
  const typeRows=Object.keys(byType).sort(function(a,b){ return byType[b]-byType[a]; }).map(function(t){
    return '<div class="pnBarRow"><span>'+gmEsc(t)+'</span><div class="pnBar"><i style="width:'+Math.round(byType[t]/Math.max(1,wb.length)*100)+'%"></i></div><b>'+byType[t]+'</b></div>';
  }).join('');
  const wr=getWritings();
  const wrRows=wr.slice(0,5).map(function(w){
    return '<div class="pnBarRow"><span>'+gmEsc(w.date.slice(5))+' '+gmEsc(w.typeName)+'</span><div class="pnBar"><i style="width:'+Math.round((w.total||0)/Math.max(1,w.full||20)*100)+'%"></i></div><b>'+(w.total||0)+'/'+(w.full||20)+'</b></div>';
  }).join('');
  el.innerHTML=
    goalHtml+
    '<div class="inkLabel">学习面板 <span class="inkHint">（近 12 周，每格一天）</span></div>'+
    '<div class="pnCard">'+
      '<div class="pnHeat">'+cells.join('')+'</div>'+
      '<div class="pnLegend"><span>🔥 连续 '+gmEsc(String(st.streak||0))+' 天 · 累计 '+(st.read||0)+' 篇</span>'+
      '<span class="pnHeatLv"><i class="pnCell lv0"></i><i class="pnCell lv2"></i><i class="pnCell lv3"></i><i class="pnCell lv4"></i> 篇数</span></div>'+
      '<div class="pnBarRow"><span>词汇已掌握</span><div class="pnBar"><i style="width:'+(wtot?Math.round(wk/Math.max(1,wtot)*100):0)+'%"></i></div><b>'+wk+'</b></div>'+
      '<div class="pnBarRow"><span>词汇巩固中</span><div class="pnBar"><i class="pnAmber" style="width:'+(wtot?Math.round(wu/Math.max(1,wtot)*100):0)+'%"></i></div><b>'+wu+'</b></div>'+
      (typeRows?('<div class="pnSec">错题类型分布（'+wb.length+' 题）</div>'+typeRows):'')+
      (wrRows?('<div class="pnSec">最近写作成绩</div>'+wrRows):'')+
      '<div class="wBtns"><button class="wBtn slim" id="pnCardBtn">📸 生成今日打卡图</button></div>'+
    '</div>';
  el.querySelectorAll('.glBtn[data-n]').forEach(function(b){
    b.onclick=function(){
      const g=getGoals(); g.n=Number(b.dataset.n); saveGoals(g); renderPanel();
    };
  });
  const rem=document.getElementById('glRemind');
  if(rem) rem.onclick=function(){
    const g=getGoals(); g.remind=(g.remind===false)?true:false; saveGoals(g); renderPanel();
    showToast(g.remind===false?'学习提醒已关闭':'🔔 学习提醒已开启（打开应用时提醒当日目标）');
  };
  const cb=document.getElementById('pnCardBtn');
  if(cb) cb.onclick=makeShareCard;
}

/* ---------- AI 作文批改 ---------- */
const WR_TOPICS={
  big:[
    {topic:'Directions: Write an essay based on the picture below. In your description, you should first describe the picture briefly, then interpret its intended meaning, and give your comments. （图画：一个年轻人站在书山脚下，抬头望向山顶的灯塔）要求：160-200 词，可自行添加细节。'},
    {topic:'Directions: Write an essay based on the chart. （图表：某社交平台用户每日平均使用时长逐年上升）You should interpret the chart and give your comments. 160-200 词。'},
    {topic:'Directions: Write an essay based on the picture. （图画：两人面对同一杯半满的水，一人沮丧一人微笑）You should describe the picture, interpret its meaning, and comment. 160-200 词。'},
    {topic:'Directions: Write an essay on the topic "The value of persistence on the postgraduate journey". You should write 160-200 words with a clear structure.'},
    {topic:'Directions: Write an essay based on the picture. （图画：一位老人向年轻人学习使用智能手机，年轻人为老人讲解）Describe, interpret and comment. 160-200 词。'},
    {topic:'Directions: Write an essay based on the chart. （图表：越来越多毕业生选择返乡就业）Interpret and comment. 160-200 词。'}
  ],
  small:[
    {topic:'Directions: Suppose you are Li Ming, a postgraduate student. Write a letter to your professor, Dr. Wang, to ask for advice on your thesis topic. You should write about 100 words. Do not sign your own name at the end; use "Li Ming" instead.'},
    {topic:'Directions: Suppose your class is going to hold an English speech contest. As the organizer, write a notice to invite classmates to participate. About 100 words, signed "Li Ming".'},
    {topic:'Directions: Suppose you borrowed a book from your friend, Zhang Wei, but lost it. Write a letter of apology and explain how you will make up for it. About 100 words, signed "Li Ming".'},
    {topic:'Directions: Write an email to a foreign professor, Dr. Smith, inviting him to give a lecture on cross-cultural communication at your university. About 100 words, signed "Li Ming".'},
    {topic:'Directions: Suppose you are Li Ming. Write a letter of recommendation for your classmate, Liu Yang, who is applying for a graduate program. About 100 words.'},
    {topic:'Directions: Suppose you are the secretary of the volunteers association. Write a letter to recruit volunteers for a city marathon. About 100 words, signed "Li Ming".'}
  ]
};
let wrType='big', wrTopic=null, wrBusy=false;
function showWriting(){
  stopTts();
  showOnly('writing');
  if(!wrTopic) wrIntro();
  window.scrollTo(0,0);
}
function wrSyncSegs(){
  [...$('#wrTypeSeg').children].forEach(function(b){ b.classList.toggle('on', b.dataset.v===wrType); });
}
function wrIntro(){
  $('#wrCount').textContent='';
  $('#wrStage').innerHTML=
    '<div class="wCard"><div class="wDone">✍️ AI 作文批改</div>'+
    '<p class="deskTip" style="margin:14px 0 18px;">选一道题，写完提交，AI 按考研评分标准给分：<br>内容 · 语言 · 结构 · 衔接 四维度打分，逐句诊断 + 高分范文。</p>'+
    '<div class="wBtns"><button class="wBtn reveal" id="wrNewTopic">🎲 随机出一题</button></div>'+
    '<p class="gmBest2">题库共 '+WR_TOPICS[wrType].length+' 道经典方向 · 也可由 AI 现场命题</p></div>';
  $('#wrNewTopic').onclick=wrNewTopicFn;
}
function wrNewTopicFn(){
  if(wrBusy) return;
  const local=WR_TOPICS[wrType][Math.floor(Math.random()*WR_TOPICS[wrType].length)];
  wrTopic={type:wrType, topic:local.topic, src:'题库'};
  wrRenderEditor();
  /* AI 现场命题：成功则替换题库题（编辑器仍在时静默升级） */
  wrBusy=true;
  const sys='你是考研英语命题专家。只输出严格JSON对象，禁止输出任何解释或markdown代码块标记。';
  const spec=wrType==='big'
    ? '出一张考研英语一大作文题（图画/图表描述类）：题面用英文 Directions 描述一幅假想图画或图表的内容与寓意方向，要求考生先描述再阐释并评论，160-200 词。'
    : '出一张考研英语小作文题（在建议信/推荐信/道歉信/邀请函/通知/招募信中随机选一类）：全英文 Directions，情景具体，约 100 词，落款用 Li Ming。';
  const usr=spec+' 输出JSON：{"topic":"完整英文题面 Directions..."}';
  aiChat(sys,usr,45000,60).then(function(txt){
    wrBusy=false;
    const j=txt?extractJSON(txt):null;
    if(j && j.topic && String(j.topic).length>40){
      wrTopic={type:wrType, topic:String(j.topic), src:'AI 命题'};
      if(document.getElementById('wrEditor') && !document.getElementById('wrResult').innerHTML) wrRenderEditor();
    }
  }).catch(function(){ wrBusy=false; });
}
function wrRenderEditor(){
  $('#wrCount').textContent=wrTopic.src;
  $('#wrStage').innerHTML=
    '<div class="wCard" style="text-align:left;" id="wrEditor">'+
      '<div class="wrTopic">'+gmEsc(wrTopic.topic)+'</div>'+
      '<textarea id="wrInput" class="wrInput" rows="10" placeholder="Start writing here...（正文直接写，无需写 Directions）"></textarea>'+
      '<div class="wrMeta"><span id="wrWords">0 词</span><span id="wrHint">'+(wrTopic.type==='big'?'建议 160-200 词':'建议 100 词左右')+'</span></div>'+
      '<div class="wBtns"><button class="wBtn reveal" id="wrSubmit">提交批改 ⟶</button></div>'+
      '<div id="wrResult"></div>'+
    '</div>';
  const ta=document.getElementById('wrInput');
  ta.addEventListener('input', function(){
    const n=ta.value.trim()?ta.value.trim().split(/\s+/).length:0;
    document.getElementById('wrWords').textContent=n+' 词';
  });
  document.getElementById('wrSubmit').onclick=wrSubmit;
}
async function wrSubmit(){
  if(wrBusy) return;
  const ta=document.getElementById('wrInput');
  const text=(ta.value||'').trim();
  const words=text?text.split(/\s+/).length:0;
  if(words<20){ showToast('作文太短了，至少写 20 个词'); return; }
  if(!wrTopic){ return; }
  wrBusy=true;
  const btn=document.getElementById('wrSubmit');
  btn.disabled=true; btn.textContent='⏳ AI 阅卷中…';
  const full=wrTopic.type==='big'?20:10;
  const sys='你是考研英语写作阅卷专家。只输出严格JSON对象，禁止输出任何解释或markdown代码块标记。';
  const usr='按考研英语'+(wrTopic.type==='big'?'大作文':'小作文')+'评分标准批改这篇学生作文。题目：'+wrTopic.topic+
    '\n学生作文（'+words+' 词）：\n'+text+
    '\n评分：满分 '+full+' 分；四个维度各 0-5 分：content 内容切题与深度 / language 语言准确性与词汇 / structure 结构与段落组织 / link 衔接连贯。'+
    '\n输出JSON：{"total":数字,"dims":{"content":n,"language":n,"structure":n,"link":n},"summary":"中文总评 60-100 字","notes":[{"orig":"学生原句或片段","comment":"中文问题诊断（语法/用词/逻辑）","fix":"英文修改建议句"}] 最多6条只挑最重要的问题,"sample":"一篇高质量英文参考范文（'+(wrTopic.type==='big'?'180 词左右':'100 词左右')+'）"}';
  let j=null;
  for(let attempt=0; attempt<2 && !j; attempt++){
    const txt=await aiChat(sys,usr,120000,120);
    j=txt?extractJSON(txt):null;
    if(j && !(typeof j.total==='number' && j.dims && j.sample)) j=null;
  }
  wrBusy=false;
  btn.disabled=false; btn.textContent='提交批改 ⟶';
  if(!j){ showToast('❌ 批改失败：AI 暂不可用，稍后再试（作文批改需要 AI 网络）'); return; }
  const score=Math.max(0,Math.min(full,Math.round(j.total)));
  const res=document.getElementById('wrResult');
  const dims=[['content','内容'],['language','语言'],['structure','结构'],['link','衔接']];
  const dimsHtml=dims.map(function(d){
    const v=Math.max(0,Math.min(5,Number(j.dims[d[0]])||0));
    return '<div class="pnBarRow"><span>'+d[1]+'</span><div class="pnBar"><i style="width:'+Math.round(v/5*100)+'%"></i></div><b>'+v+'/5</b></div>';
  }).join('');
  const notes=(Array.isArray(j.notes)?j.notes:[]).slice(0,6).map(function(n){
    return '<div class="wrNote"><div class="wrOrig">'+gmEsc(n.orig||'')+'</div>'+
      '<div class="wrComment">🔍 '+gmEsc(n.comment||'')+'</div>'+
      (n.fix?('<div class="wrFix">✍️ '+gmEsc(n.fix)+'</div>'):'')+'</div>';
  }).join('');
  res.innerHTML=
    '<div class="wrScore"><b>'+score+'</b><span>/ '+full+' 分</span>'+
      '<div class="pnBarRow" style="margin-top:8px;"><div class="pnBar"><i style="width:'+Math.round(score/full*100)+'%"></i></div></div></div>'+
    '<div class="pnSec">四维度评分</div>'+dimsHtml+
    '<div class="pnSec">总评</div><div class="wrSummary">'+gmEsc(j.summary||'')+'</div>'+
    (notes?('<div class="pnSec">逐句诊断</div>'+notes):'')+
    (j.sample?('<div class="pnSec">高分范文</div><div class="wrSample">'+gmEsc(j.sample)+'</div>'):'')+
    '<div class="wBtns"><button class="wBtn again" id="wrAgain">🔁 换一题再写</button></div>';
  document.getElementById('wrAgain').onclick=function(){ wrTopic=null; wrIntro(); window.scrollTo(0,0); };
  const wr=getWritings();
  const ds=function(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  wr.unshift({date:ds(new Date()), type:wrTopic.type, typeName:(wrTopic.type==='big'?'大作文':'小作文'),
              total:score, full:full});
  saveWritings(wr);
  renderPanel();
  showToast('✅ 批改完成：'+score+'/'+full+' 分');
}
$('#wrBack').onclick=function(){ stopTts(); showHome(); };
$('#wrTypeSeg').addEventListener('click', function(ev){
  const b=ev.target.closest('button'); if(!b || b.dataset.v===wrType) return;
  wrType=b.dataset.v; wrTopic=null; wrBusy=false;
  wrSyncSegs(); wrIntro();
});

/* ---------- 读后 AI 讨论（阅读室内嵌） ---------- */
let talk={qs:null, idx:0, busy:false};
$('#talkBtn').onclick=function(){
  const box=document.getElementById('talkBox');
  if(box.style.display==='block'){ box.style.display='none'; return; }
  box.style.display='block';
  if(!talk.qs) startTalk();
};
function talkPassageText(){
  return (curPassage&&curPassage.paras)?curPassage.paras.flat().map(function(s){ return s.en; }).join(' ').slice(0,1200):'';
}
async function startTalk(){
  const box=document.getElementById('talkBox');
  if(!curPassage||!curPassage.paras){ box.innerHTML='<div class="tkCard">先在书桌上放一篇文章，再来讨论吧</div>'; return; }
  box.innerHTML='<div class="tkCard tkWait">💬 正在根据《'+gmEsc(curPassage.titleEn||'本文')+'》生成讨论问题…</div>';
  const sys='你是英语讨论课老师。只输出严格JSON对象，禁止输出任何解释或markdown代码块标记。';
  const usr='基于下面这篇短文，出 3 个开放性英语讨论问题（第 1 个考察对文章观点的理解，第 2 个考察细节推理，第 3 个联系现实生活），每题配中文提示。\n短文：'+talkPassageText()+
    '\n输出JSON：{"qs":[{"q":"English question","cn":"中文提示（该怎么答）"}]}';
  let j=null;
  for(let attempt=0; attempt<2 && !j; attempt++){
    const txt=await aiChat(sys,usr,60000,60);
    j=txt?extractJSON(txt):null;
    if(j && (!Array.isArray(j.qs) || !j.qs.length)) j=null;
  }
  if(!j){ box.innerHTML='<div class="tkCard">❌ 问题生成失败（讨论需要 AI 网络），稍后再试。</div>'; return; }
  talk.qs=j.qs.slice(0,3).map(function(x){ return {q:String(x.q||''), cn:String(x.cn||'')}; });
  talk.idx=0;
  renderTalkQ();
}
function renderTalkQ(){
  const box=document.getElementById('talkBox');
  const q=talk.qs[talk.idx];
  box.innerHTML=
    '<div class="inkLabel">💬 读后讨论 <span class="inkHint">（第 '+(talk.idx+1)+' / '+talk.qs.length+' 问）</span></div>'+
    '<div class="tkCard"><div class="tkQ">'+gmEsc(q.q)+'</div><div class="tkCn">💡 '+gmEsc(q.cn)+'</div>'+
    '<textarea id="tkInput" class="wrInput" rows="4" placeholder="Answer in English..."></textarea>'+
    '<div class="wBtns"><button class="wBtn reveal" id="tkSend">提交回答 ⟶</button></div><div id="tkResult"></div></div>';
  document.getElementById('tkSend').onclick=submitTalkAns;
}
async function submitTalkAns(){
  if(talk.busy) return;
  const ta=document.getElementById('tkInput');
  const text=(ta.value||'').trim();
  if(!text){ showToast('先写下你的回答'); return; }
  talk.busy=true;
  const btn=document.getElementById('tkSend');
  btn.disabled=true; btn.textContent='⏳ AI 点评中…';
  const sys='你是英语讨论课老师。只输出严格JSON对象，禁止输出任何解释或markdown代码块标记。';
  const usr='学生刚读完一篇文章，讨论问题是：'+talk.qs[talk.idx].q+
    '\n学生的回答：'+text+
    '\n请点评。输出JSON：{"verdict":"good"或"ok"或"weak","feedback":"中文点评 40-80 字（先肯定再指出语法/用词问题）","better":"改进后的英文参考回答"}';
  let j=null;
  for(let attempt=0; attempt<2 && !j; attempt++){
    const txt=await aiChat(sys,usr,60000,30);
    j=txt?extractJSON(txt):null;
    if(j && !j.feedback) j=null;
  }
  talk.busy=false;
  if(!j){ btn.disabled=false; btn.textContent='提交回答 ⟶'; showToast('❌ 点评失败：AI 暂不可用'); return; }
  const res=document.getElementById('tkResult');
  const cls=j.verdict==='good'?'g':(j.verdict==='weak'?'r':'y');
  const mark=j.verdict==='good'?'🌟 很棒':(j.verdict==='weak'?'💪 再练练':'👍 不错');
  res.innerHTML=
    '<div class="tkVerdict '+cls+'">'+mark+'</div>'+
    '<div class="tkFeedback">'+gmEsc(j.feedback||'')+'</div>'+
    (j.better?('<div class="pnSec">参考回答</div><div class="wrSample">'+gmEsc(j.better)+'</div>'):'')+
    '<div class="wBtns"><button class="wBtn again" id="tkNext">'+(talk.idx<talk.qs.length-1?'下一问 ⟶':'完成讨论 ✓')+'</button></div>';
  res.scrollIntoView({behavior:'smooth', block:'nearest'});
  document.getElementById('tkNext').onclick=function(){
    if(talk.idx<talk.qs.length-1){ talk.idx++; renderTalkQ(); }
    else{
      const box=document.getElementById('talkBox');
      box.innerHTML='<div class="tkCard"><div class="wDone">🎉 讨论完成</div><div class="wDoneSub">能把读到的说出来，才是真正吃透了一篇文章</div>'+
        '<div class="wBtns"><button class="wBtn again" id="tkRestart">🔄 再讨论一轮</button></div></div>';
      document.getElementById('tkRestart').onclick=function(){ talk.qs=null; startTalk(); };
    }
  };
}

/* ---------- 仿真模考 ---------- */
let mk=null;
function getMockHist(){ try{ return JSON.parse(localStorage.getItem('yt_mock')||'[]'); }catch(e){ return []; } }
function saveMockHist(h){ try{ localStorage.setItem('yt_mock', JSON.stringify(h.slice(0,10))); }catch(e){} }
function showMock(){
  stopTts(); gmStopAll();
  showOnly('mock');
  if(!mk) mkIntro();
  window.scrollTo(0,0);
}
function mkIntro(){
  const hist=getMockHist();
  $('#mkTimer').textContent=''; $('#mkCount').textContent='';
  $('#mkTimeBar').style.width='0%';
  $('#mkReport').innerHTML='';
  $('#mockStage').innerHTML=
    '<div class="wCard"><div class="wDone">⏱ 仿真模考</div>'+
    '<p class="deskTip" style="margin:14px 0 18px;">考研标准难度整卷：阅读 ×2（10 题）+ 选词填空（10 空）+ 长篇段落匹配（10 题），<br>共 30 题，全部离线生成。选好时长，一口气做完，看真实正确率。</p>'+
    '<div class="seg" id="mkLenSeg" style="margin:0 0 16px;">'+
      '<button data-v="50" class="on">50 分钟 · 标准卷</button>'+
      '<button data-v="25">25 分钟 · 快速卷</button>'+
      '<button data-v="0">不限时</button>'+
    '</div>'+
    '<div class="wBtns"><button class="wBtn reveal" id="mkStart">开考 ⟶</button></div>'+
    (hist.length?('<div class="pnSec">最近成绩</div>'+hist.slice(0,5).map(function(m){
      return '<div class="pnBarRow"><span>'+gmEsc(m.date.slice(5))+' '+m.secs+'分钟</span><div class="pnBar"><i style="width:'+Math.round(m.right/Math.max(1,m.total)*100)+'%"></i></div><b>'+m.right+'/'+m.total+'</b></div>';
    }).join('')):'')+
    '</div>';
  $('#mkLenSeg').addEventListener('click', function(ev){
    const b=ev.target.closest('button'); if(!b) return;
    [...$('#mkLenSeg').children].forEach(function(x){ x.classList.toggle('on', x===b); });
  });
  $('#mkStart').onclick=function(){
    const mins=Number([...$('#mkLenSeg').children].find(function(x){ return x.classList.contains('on'); }).dataset.v);
    buildMock(mins);
  };
}
async function buildMock(mins){
  const btn=document.getElementById('mkStart');
  btn.disabled=true; btn.textContent='⏳ 正在组卷…';
  try{ await ensureWordBank(); }catch(e){ showToast('词库加载失败，请检查网络后重试'); btn.disabled=false; btn.textContent='开考 ⟶'; return; }
  const p1=buildPassage('std', LEVELS.std.plan);
  const p2=buildPassage('std', LEVELS.std.plan);
  const clz=buildLocalClozeData('kao');   /* CLOZE_LEVELS 键：cet4/cet6/kao */
  const lr=buildLocalLR('cet6');          /* LR_LEVELS 键：cet4/cet6 */
  mk={
    parts:[
      {type:'read',  label:'Part A · 阅读理解 ①', passage:p1, items:buildCompQuiz(p1), answers:[], t0:Date.now(), t1:0, right:null, total:0},
      {type:'read',  label:'Part A · 阅读理解 ②', passage:p2, items:buildCompQuiz(p2), answers:[], t0:Date.now(), t1:0, right:null, total:0},
      {type:'cloze', label:'Part B · 选词填空',   clz:clz, sel:null, t0:Date.now(), t1:0, right:null, total:0},
      {type:'lr',    label:'Part C · 长篇阅读',   lr:lr, answers:new Array(lr.statements.length).fill(null), t0:Date.now(), t1:0, right:null, total:0}
    ],
    cur:0, mins:mins, left:mins*60, timer:null, done:false, t0:Date.now()
  };
  btn.disabled=false;
  if(mins>0){
    mk.timer=setInterval(function(){
      mk.left--;
      const c=document.getElementById('mkTimer');
      if(c) c.textContent='⏱ '+Math.floor(Math.max(0,mk.left)/60)+':'+String(Math.max(0,mk.left)%60).padStart(2,'0');
      const bar=document.getElementById('mkTimeBar');
      if(bar) bar.style.width=Math.max(0, mk.left/(mk.mins*60)*100)+'%';
      if(mk.left<=0) mkFinish(true);
    },1000);
  }
  mkRenderPart();
}
function mkRenderPart(){
  const part=mk.parts[mk.cur];
  $('#mkCount').textContent='第 '+(mk.cur+1)+' / '+mk.parts.length+' 部分';
  $('#mkTimer').textContent = mk.mins>0 ? '⏱ '+Math.floor(mk.left/60)+':'+String(mk.left%60).padStart(2,'0') : '不限时';
  const st=$('#mockStage');
  let html='<div class="mkPart"><div class="mkPartHead">'+gmEsc(part.label)+'<span>完成后自动进入下一部分</span></div>';
  if(part.type==='read'){
    html+='<div class="clozeCard"><h3 class="mkTitle">'+gmEsc(part.passage.titleEn)+'</h3>'+
      part.passage.paras.map(function(pa){ return '<p>'+gmEsc(pa.map(function(s){ return s.en; }).join(' '))+'</p>'; }).join('')+'</div>';
    html+='<div class="inkLabel">Questions '+part.items.length+'</div>';
    part.items.forEach(function(q,qi){
      html+='<div class="mkQ" data-qi="'+qi+'"><div class="mkQHead"><span class="wTag">'+gmEsc(q.type)+'题</span> '+gmEsc(q.prompt)+'</div>'+
        (q.body?('<div class="mkQBody">'+gmEsc(q.body)+'</div>'):'')+
        '<div class="mkOpts">';
      q.options.forEach(function(opt,oi){
        html+='<button class="qOpt'+(part.answers[qi]===oi?' sel':'')+'" data-qi="'+qi+'" data-oi="'+oi+'"><b>'+'ABCD'[oi]+'.</b> '+gmEsc(opt)+'</button>';
      });
      html+='</div></div>';
    });
  } else if(part.type==='cloze'){
    const c=part.clz;
    html+='<div class="clozeCard">';
    let fi=0;
    c.passage.paras.forEach(function(pa){
      html+='<p>';
      pa.forEach(function(s){
        let b=null;
        c.blanks.forEach(function(bb){ if(bb.sent===fi) b=bb; });
        let toks=s.en.split(' ');
        if(b){
          const k=c.blanks.indexOf(b);
          toks[b.ti]='<span class="clz mkClz'+(part.sel===k?' sel':'')+(b.user?' filled':'')+'" data-b="'+k+'">'+(b.user||('<i>'+(k+1)+'</i>'))+'</span>';
        }
        html+=toks.join(' ')+' ';
        fi++;
      });
      html+='</p>';
    });
    html+='</div><div class="inkLabel">词库 A–O（点选单词 → 点空格填入；再点空格取回）</div><div class="clzBank" id="mkBank"></div>';
  } else if(part.type==='lr'){
    const lr=part.lr;
    html+='<div class="clozeCard"><h3 class="mkTitle">'+gmEsc(lr.title||'Section B')+'</h3>'+
      lr.paras.map(function(pa,i){
        return '<p><b class="lrStmt">'+(lr.letters[i]||String.fromCharCode(65+i))+'</b> '+gmEsc(pa.en)+'</p>';
      }).join('')+'</div>';
    html+='<div class="inkLabel">为每个句子选择出处段落</div>';
    lr.statements.forEach(function(s2,i){
      html+='<div class="mkQ"><div class="mkQBody">'+(i+1)+'. '+gmEsc(s2.text)+'</div><div class="mkOpts mkLetters">';
      lr.letters.forEach(function(L){
        html+='<button class="mkL'+(part.answers[i]===L?' sel':'')+'" data-qi="'+i+'" data-l="'+L+'">'+L+'</button>';
      });
      html+='</div></div>';
    });
  }
  html+='<div class="wBtns"><button class="wBtn reveal" id="mkPartDone">'+(mk.cur<mk.parts.length-1?'完成本部分，进入下一部分 ⟶':'交卷，查看成绩 ⟶')+'</button></div></div>';
  st.innerHTML=html;
  st.querySelectorAll('.qOpt').forEach(function(b){
    b.onclick=function(){
      const qi=+b.dataset.qi, oi=+b.dataset.oi;
      mk.parts[mk.cur].answers[qi]=oi;
      const box=b.closest('.mkOpts');
      [...box.children].forEach(function(x,j){ x.classList.toggle('sel', j===oi); });
    };
  });
  st.querySelectorAll('.mkL').forEach(function(b){
    b.onclick=function(){
      const qi=+b.dataset.qi, L=b.dataset.l;
      mk.parts[mk.cur].answers[qi]=L;
      const box=b.closest('.mkLetters');
      [...box.children].forEach(function(x){ x.classList.toggle('sel', x.dataset.l===L); });
    };
  });
  if(part.type==='cloze'){
    const bk=document.getElementById('mkBank');
    part.clz.bank.forEach(function(w){
      const b=document.createElement('button');
      b.className='clzChip'+(w.used?' used':'')+(part.sel===w.word?' sel':'');
      b.innerHTML='<b>'+w.letter+'</b>'+gmEsc(w.word);
      b.onclick=function(){
        if(w.used){ showToast('这个词已经填入了'); return; }
        part.sel=(part.sel===w.word)?null:w.word;
        mkRenderPart();
      };
      bk.appendChild(b);
    });
    st.querySelectorAll('.mkClz').forEach(function(el){
      el.onclick=function(){
        const k=+el.dataset.b, b=part.clz.blanks[k];
        if(part.sel){
          const old=part.clz.bank.find(function(x){ return x.word===b.user; });
          if(old) old.used=false;
          b.user=part.sel;
          const nb=part.clz.bank.find(function(x){ return x.word===part.sel; });
          if(nb) nb.used=true;
          part.sel=null;
          mkRenderPart();
        }else if(b.user){
          const old=part.clz.bank.find(function(x){ return x.word===b.user; });
          if(old) old.used=false;
          b.user=null;
          mkRenderPart();
        }else{ showToast('先在下方词库点选一个单词'); }
      };
    });
  }
  document.getElementById('mkPartDone').onclick=mkPartDone;
  window.scrollTo(0,0);
}
function mkPartDone(){
  const part=mk.parts[mk.cur];
  part.t1=Date.now();
  if(part.type==='read'){
    part.right=part.items.reduce(function(n,q,qi){ return n+((part.answers[qi]===q.ans)?1:0); },0);
    part.total=part.items.length;
    part.items.forEach(function(q,qi){
      if(part.answers[qi]!==q.ans){
        addWrong({type:q.type, prompt:q.prompt, body:q.body||'', options:q.options, ans:q.ans,
                  your:(part.answers[qi]!=null)?q.options[part.answers[qi]]:null, yourIdx:part.answers[qi],
                  title:part.passage.titleEn});
      }
    });
  } else if(part.type==='cloze'){
    part.clz.done=true;
    let right=0;
    part.clz.blanks.forEach(function(b){
      b.ok=!!b.user && (b.user.toLowerCase()===b.word);
      if(b.ok) right++;
    });
    part.right=right; part.total=part.clz.blanks.length;
  } else if(part.type==='lr'){
    let right=0;
    part.lr.statements.forEach(function(s2,i){ if(part.answers[i]===s2.letter) right++; });
    part.right=right; part.total=part.lr.statements.length;
  }
  if(mk.cur<mk.parts.length-1){ mk.cur++; mkRenderPart(); }
  else mkFinish(false);
}
function mkFinish(timeout){
  if(mk.done) return;
  mk.done=true;
  if(mk.timer){ clearInterval(mk.timer); mk.timer=null; }
  const usedSecs=Math.round((Date.now()-mk.t0)/1000);
  let right=0, total=0;
  const rows=mk.parts.map(function(p){
    if(p.right==null){ p.right=0; p.total=(p.items||[]).length || (p.clz?p.clz.blanks.length:0) || (p.lr?p.lr.statements.length:0); }
    right+=p.right; total+=p.total;
    const secs=Math.round(((p.t1||Date.now())-p.t0)/1000);
    return '<div class="pnBarRow"><span>'+gmEsc(p.label)+'</span><div class="pnBar"><i style="width:'+Math.round(p.right/Math.max(1,p.total)*100)+'%"></i></div><b>'+p.right+'/'+p.total+'</b></div>';
  }).join('');
  const minsUsed=mk.mins>0?Math.max(1,Math.min(mk.mins, mk.mins-Math.ceil(mk.left/60))):Math.max(1,Math.round(usedSecs/60));
  $('#mockStage').innerHTML='';
  $('#mkTimer').textContent='';
  $('#mkCount').textContent='已交卷';
  $('#mkReport').innerHTML=
    '<div class="wCard"><div class="wDone">'+(timeout?'⏰ 时间到，自动交卷':'🎉 交卷成功')+'</div>'+
    '<div class="wDoneSub">正确 '+right+' / '+total+' · 用时约 '+minsUsed+' 分钟</div>'+
    '<div class="pnSec">各部分得分</div>'+rows+
    '<div class="wBtns"><button class="wBtn again" id="mkAgain">🔁 再来一卷</button></div></div>';
  const hist=getMockHist();
  const ds=function(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  hist.unshift({date:ds(new Date()), secs:minsUsed, right:right, total:total});
  saveMockHist(hist);
  showToast((timeout?'时间到，已自动交卷':'交卷完成')+'：正确 '+right+'/'+total);
}
$('#mockBack').onclick=function(){
  if(mk && !mk.done && mk.timer){ if(!confirm('模考进行中，确定离开吗？（计时将停止）')) return; }
  if(mk && mk.timer){ clearInterval(mk.timer); mk.timer=null; }
  mk=null;
  showHome();
};

/* ---------- 每日目标 · 提醒 ---------- */
function getGoals(){ try{ return JSON.parse(localStorage.getItem('yt_goals')||'{"n":1,"remind":true}'); }catch(e){ return {n:1, remind:true}; } }
function saveGoals(g){ try{ localStorage.setItem('yt_goals', JSON.stringify(g)); }catch(e){} }
function checkDailyRemind(){
  const g=getGoals(); if(g.remind===false) return;
  const st=getStats(); const daily=st.daily||{};
  const ds=function(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const d0=daily[ds(new Date())]||{read:0};
  const need=Number(g.n)||1;
  if((d0.read||0)>=need) return;
  let last=0;
  try{ last=Number(localStorage.getItem('yt_remind')||0); }catch(e){}
  if(Date.now()-last < 4*3600*1000) return;
  try{ localStorage.setItem('yt_remind', String(Date.now())); }catch(e){}
  const msg='今日目标还差 '+Math.max(1,need-(d0.read||0))+' 篇阅读，坚持就是胜利！';
  showToast('🎯 '+msg);
  try{
    if(navigator.serviceWorker && navigator.serviceWorker.controller){
      navigator.serviceWorker.controller.showNotification('研途阅读 · 每日目标', {body:msg, icon:'./icon-192.png', tag:'yantu-daily'});
    }
  }catch(e){}
}
setTimeout(checkDailyRemind, 2600);

/* ---------- Anki 导出 ---------- */
function csvCell(s){ s=String(s==null?'':s); return '"'+s.replace(/"/g,'""')+'"'; }
function downloadText(name, content){
  const blob=new Blob([content], {type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click(); a.remove();
}
$('#btnAnki').onclick=function(){
  try{
    const idx=wordIndex();
    const ws=getWordState();
    const rows1=[];
    Object.keys(ws).forEach(function(w){
      const e=idx[w]; if(!e) return;
      rows1.push([w, '/'+(e[1]||'')+'/', e[2]||'', e[3]||'', e[4]||'', e[5]||'', ws[w].s==='k'?'已掌握':'巩固中']);
    });
    const csv1='word,ipa,meaning,example,example_cn,tags,status\n'+rows1.map(function(r){ return r.map(csvCell).join(','); }).join('\n');
    const wb=getWrongBook();
    const rows2=wb.map(function(x){
      return [x.type||'', (x.prompt||'')+((x.body)?(' | '+x.body):''), x.correct||'', x.your||'', x.title||''];
    });
    const csv2='type,front,correct,yours,source\n'+rows2.map(function(r){ return r.map(csvCell).join(','); }).join('\n');
    downloadText('yantu-anki-words.csv', '\ufeff'+csv1);
    setTimeout(function(){ downloadText('yantu-anki-wrong.csv', '\ufeff'+csv2); }, 400);
    showToast('📤 已导出背词 '+rows1.length+' 词 + 错题 '+rows2.length+' 题（Anki 可导入 CSV）');
  }catch(e){ showToast('导出失败：'+e.message); }
};

/* ---------- 分享打卡卡片（canvas 生成 PNG） ---------- */
function rrPath(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function makeShareCard(){
  try{
    const cv=document.createElement('canvas'); cv.width=900; cv.height=1200;
    const ctx=cv.getContext('2d');
    const st=getStats(), daily=getDaily();
    const ds=function(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
    const today=ds(new Date());
    const d0=daily[today]||{read:0,words:0};
    const serif='"Noto Serif SC","Songti SC","STSong",serif';
    /* 夜幕 */
    const g=ctx.createLinearGradient(0,0,0,1200);
    g.addColorStop(0,'#1c150c'); g.addColorStop(.72,'#14100b'); g.addColorStop(1,'#0d0a06');
    ctx.fillStyle=g; ctx.fillRect(0,0,900,1200);
    /* 暖晕 */
    const rg=ctx.createRadialGradient(450,1040,20,450,1040,520);
    rg.addColorStop(0,'rgba(201,143,45,.16)'); rg.addColorStop(1,'rgba(201,143,45,0)');
    ctx.fillStyle=rg; ctx.fillRect(0,600,900,600);
    /* 城郭 + 窗灯 */
    const bs=[[0,780,92,300],[100,830,88,250],[190,760,104,320],[300,840,70,180],[372,800,112,280],
              [486,740,106,340],[596,828,66,190],[666,790,98,290],[768,848,72,170],[844,760,110,320],
              [958,820,86,200],[1048,790,152,290]];
    ctx.fillStyle='#191209';
    bs.forEach(function(b){ ctx.fillRect(b[0],b[1],b[2],1200-b[1]); });
    let seed=7;
    const rnd=function(){ seed=(seed*9301+49297)%233280; return seed/233280; };
    bs.forEach(function(b){
      for(let i=0;i<4;i++){
        if(rnd()<0.42) continue;
        ctx.fillStyle='rgba(233,180,92,'+(0.5+rnd()*0.5).toFixed(2)+')';
        ctx.fillRect(b[0]+10+rnd()*(b[2]-26), b[1]+16+rnd()*(1200-b[1]-40), 8, 12);
      }
    });
    /* 印章 */
    ctx.save(); ctx.translate(742,132); ctx.rotate(-0.10);
    ctx.fillStyle='#b5382f'; rrPath(ctx,-42,-42,84,84,10); ctx.fill();
    ctx.strokeStyle='rgba(246,236,210,.4)'; ctx.lineWidth=2; rrPath(ctx,-36,-36,72,72,8); ctx.stroke();
    ctx.fillStyle='#f6ecd2'; ctx.font='700 25px '+serif; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('研',-19,-19); ctx.fillText('途',19,-19); ctx.fillText('阅',-19,19); ctx.fillText('读',19,19);
    ctx.restore();
    /* 标题 */
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillStyle='#f2e7cc'; ctx.font='700 62px '+serif;
    ctx.fillText('今日学习打卡', 450, 300);
    ctx.font='23px '+serif; ctx.fillStyle='rgba(216,184,122,.9)';
    ctx.fillText(today+' · 考研英语', 450, 348);
    /* 大数字 */
    ctx.fillStyle='#d4a24e'; ctx.font='800 118px '+serif;
    ctx.fillText(String(st.streak||0), 450, 556);
    ctx.font='25px '+serif; ctx.fillStyle='rgba(232,220,194,.85)';
    ctx.fillText('连续学习天数', 450, 604);
    /* 分隔线 */
    ctx.fillStyle='rgba(212,85,63,.6)'; ctx.fillRect(330,668,240,2);
    /* 三个统计 */
    const items=[['累计阅读', (st.read||0)+' 篇'], ['今日完成', (d0.read||0)+' 篇'], ['累计词数', (st.words||0).toLocaleString('en-US')]];
    items.forEach(function(it,i){
      const x=190+i*260;
      ctx.fillStyle='#d4a24e'; ctx.font='700 33px '+serif; ctx.fillText(String(it[1]), x, 756);
      ctx.fillStyle='rgba(160,142,111,.95)'; ctx.font='17px '+serif; ctx.fillText(it[0], x, 792);
    });
    /* 底部 */
    ctx.fillStyle='rgba(242,231,204,.75)'; ctx.font='19px '+serif;
    ctx.fillText('研途阅读 · 每天一篇，稳稳上岸', 450, 1128);
    ctx.fillStyle='rgba(160,142,111,.7)'; ctx.font='15px '+serif;
    ctx.fillText('yantu-reading.pages.dev', 450, 1160);
    /* 下载 */
    const a=document.createElement('a');
    a.href=cv.toDataURL('image/png');
    a.download='yantu-打卡-'+today+'.png';
    document.body.appendChild(a); a.click(); a.remove();
    showToast('📸 打卡图已生成并保存');
  }catch(e){ showToast('生成失败：'+e.message); }
}

/* ---------- 翻译训练 ---------- */
let transState=null, transBusy=false;
function showTrans(){
  stopTts();
  showOnly('trans');
  if(!transState) buildTrans();
  window.scrollTo(0,0);
}
function buildTrans(){
  const p=buildPassage('std', LEVELS.std.plan);
  const flat=[];
  p.paras.forEach(function(pa,pi){
    pa.forEach(function(s,si){ flat.push({pi:pi, si:si, en:s.en, cn:s.cn||'', words:s.en.trim().split(/\s+/).length}); });
  });
  flat.sort(function(a,b){ return b.words-a.words; });
  const picked=flat.slice(0,5);
  picked.sort(function(a,b){ return (a.pi*1000+a.si)-(b.pi*1000+b.si); });
  const chosen={}; picked.forEach(function(x){ chosen[x.pi+':'+x.si]=1; });
  transState={passage:p, picked:picked, chosen:chosen, answers:new Array(picked.length).fill(''), done:false};
  renderTrans();
}
function renderTrans(){
  const t=transState;
  $('#trCount').textContent=t.done?('总分 '+(t.result?t.result.total:0)+'/10'):'';
  let html='<div class="clozeCard"><h3 class="mkTitle">'+gmEsc(t.passage.titleEn)+'</h3>';
  t.passage.paras.forEach(function(pa,pi){
    html+='<p>';
    pa.forEach(function(s,si){
      html+=(t.chosen[pi+':'+si] ? '<span class="trHL">'+gmEsc(s.en)+'</span>' : gmEsc(s.en))+' ';
    });
    html+='</p>';
  });
  html+='</div>';
  html+='<div class="inkLabel">将画线句译成汉语（每句 2 分，共 10 分）</div>';
  t.picked.forEach(function(x,i){
    html+='<div class="trQ"><div class="trNo">'+(i+1)+'</div><div class="trBody">'+
      '<div class="trSent">'+gmEsc(x.en)+'</div>'+
      '<textarea class="wrInput trInput" rows="2" data-ti="'+i+'" placeholder="在此写出中文译文…">'+gmEsc(t.answers[i])+'</textarea></div></div>';
  });
  html+='<div class="wBtns"><button class="wBtn reveal" id="trSubmit">'+(t.done?'✅ 已批改':'✓ 提交批改（AI 逐句评分）')+'</button></div><div id="trResult"></div>';
  $('#transStage').innerHTML=html;
  [...document.querySelectorAll('.trInput')].forEach(function(ta){
    ta.addEventListener('input', function(){ transState.answers[+ta.dataset.ti]=ta.value; });
  });
  document.getElementById('trSubmit').onclick=gradeTrans;
}
async function gradeTrans(){
  if(transBusy || transState.done) return;
  const t=transState;
  const filled=t.answers.filter(function(a){ return a&&a.trim(); }).length;
  if(filled===0){ showToast('至少翻译一句再提交'); return; }
  if(filled<t.picked.length && !confirm('还有 '+(t.picked.length-filled)+' 句未翻译，未译句按 0 分计，确定提交吗？')) return;
  transBusy=true;
  const btn=document.getElementById('trSubmit');
  btn.disabled=true; btn.textContent='⏳ AI 批改中…';
  const sys='你是考研英语翻译阅卷专家。只输出严格JSON对象，禁止输出任何解释或markdown代码块标记。';
  let usr='下面是考研英语文章中的 5 个长难句和学生的中文译文。逐句按「信（准确）·达（通顺）」评分，每句满分 2 分（0/0.5/1/1.5/2）。\n';
  t.picked.forEach(function(x,i){
    usr+='\n【第'+(i+1)+'句】英文：'+x.en+'\n学生译文：'+(t.answers[i]||'（未作答）')+'\n参考意群：'+x.cn;
  });
  usr+='\n输出JSON：{"items":[{"idx":1,"score":2,"comment":"中文点评 20-40 字（指出关键得分点/失分点）","better":"更好的中文译文"}],"total":总分0-10}';
  let j=null;
  for(let attempt=0; attempt<2 && !j; attempt++){
    const txt=await aiChat(sys,usr,120000,80);
    j=txt?extractJSON(txt):null;
    if(j && !Array.isArray(j.items)) j=null;
  }
  transBusy=false;
  btn.disabled=false; btn.textContent='✓ 提交批改（AI 逐句评分）';
  if(!j){ showToast('❌ 批改失败：AI 暂不可用，稍后再试'); return; }
  t.done=true; t.result=j;
  const hist=getTrans();
  const ds=function(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  hist.unshift({date:ds(new Date()), total:Math.max(0,Math.min(10,Math.round(j.total||0)))});
  saveTrans(hist);
  renderTrans();
  const res=document.getElementById('trResult');
  const items=(j.items||[]).map(function(it){
    const s2=Math.max(0,Math.min(2,Number(it.score)||0));
    return '<div class="trRes"><div class="trResHead"><b>第 '+(it.idx||'')+' 句</b><span class="'+(s2>=1.5?'g':(s2>=1?'y':'r'))+'">'+s2+' / 2 分</span></div>'+
      '<div class="trComment">'+gmEsc(it.comment||'')+'</div>'+
      (it.better?('<div class="wrFix">✍️ 参考译文：'+gmEsc(it.better)+'</div>'):'')+'</div>';
  }).join('');
  res.innerHTML='<div class="pnSec">逐句评分（总分 '+Math.max(0,Math.min(10,Math.round(j.total||0)))+'/10）</div>'+items;
  showToast('✅ 翻译批改完成：'+Math.max(0,Math.min(10,Math.round(j.total||0)))+'/10 分');
}
function getTrans(){ try{ return JSON.parse(localStorage.getItem('yt_trans')||'[]'); }catch(e){ return []; } }
function saveTrans(h){ try{ localStorage.setItem('yt_trans', JSON.stringify(h.slice(0,20))); }catch(e){} }
$('#trBack').onclick=function(){ stopTts(); showHome(); };

/* ---------- 考研一 · 完形填空（20 空四选一） ---------- */
let cloze1Mode='select', c1=null;
try{ cloze1Mode=localStorage.getItem('yt_cloze1mode')||'select'; }catch(e){}
function syncClozeSegs(){
  [...$('#clozeModeSeg').children].forEach(function(b){ b.classList.toggle('on', b.dataset.v===cloze1Mode); });
  const isC1=(cloze1Mode==='cloze1');
  $('#clozeLevel').style.display=isC1?'none':'flex';
  $('#clozePassage').style.display=isC1?'none':'block';
  $('#cloze1Stage').style.display=isC1?'block':'none';
  $('#clzBankLabel').style.display=isC1?'none':'block';
  $('#clzBank').style.display=isC1?'none':'flex';
  $('#clzMeaning').style.display=isC1?'none':'block';
  if(isC1){ $('#cSubmit').style.display='none'; $('#cNew').style.display='none'; }
}
$('#clozeModeSeg').addEventListener('click', function(ev){
  const b=ev.target.closest('button'); if(!b || b.dataset.v===cloze1Mode) return;
  cloze1Mode=b.dataset.v;
  try{ localStorage.setItem('yt_cloze1mode', cloze1Mode); }catch(e){}
  syncClozeSegs();
  if(cloze1Mode==='cloze1'){ buildCloze1(); }
  else { $('#cLevel').textContent=CLOZE_LEVELS[clozeLevel].label; renderCloze(); }
});
async function buildCloze1(){
  const st=$('#cloze1Stage');
  st.innerHTML='<div class="wCard tkWait">⏳ 正在出完形题…</div>';
  try{
    await ensureWordBank();
    /* 完形需要长文：用 std 级（约 500 词）文章挖 20 空，词性档位沿用 kao */
    const pOverride=buildPassage('std', LEVELS.std.plan);
    const data=buildLocalClozeData('kao', 20, false, pOverride);
    const wm=wordMap();
    const inText=data.sents.map(function(s){ return s.en.toLowerCase(); }).join(' ');
    data.blanks.forEach(function(b){
      const pc=(b.m&&b.m.pos?b.m.pos:'x').charAt(0);
      let pool=Object.keys(wm).filter(function(w){
        return w.length>=4 && w!==b.word && !inText.includes(w) && (wm[w].pos||'x').charAt(0)===pc;
      });
      if(pool.length<3) pool=Object.keys(wm).filter(function(w){ return w.length>=4 && w!==b.word && !inText.includes(w); });
      const dis=shuffle(pool).slice(0,3);
      b.options=shuffle([b.word].concat(dis));
      b.ans=b.options.indexOf(b.word);
      b.ok=null;
    });
    c1=data;
    c1.done=false; c1.right=0;
    c1.answers=new Array(c1.blanks.length).fill(null);
    renderCloze1();
  }catch(e){
    st.innerHTML='<div class="wCard">❌ 出题失败：'+gmEsc(e.message)+'</div>';
  }
}
function renderCloze1(){
  const st=$('#cloze1Stage'); const c=c1;
  $('#cLevel').textContent='考研一 · 20 空';
  let html='<div class="clozeCard">';
  let fi=0;
  c.passage.paras.forEach(function(pa){
    html+='<p>';
    pa.forEach(function(s){
      let b=null;
      c.blanks.forEach(function(bb){ if(bb.sent===fi) b=bb; });
      let toks=s.en.split(' ');
      if(b){
        const k=c.blanks.indexOf(b);
        let inner;
        if(!c.done) inner='<b>'+(k+1)+'</b>';
        else inner='<span class="'+(b.ok?'okT':'badT')+'">'+b.word+'</span>';
        toks[b.ti]='<span class="clz1" data-k="'+k+'">'+inner+'</span>';
      }
      html+=toks.join(' ')+' ';
      fi++;
    });
    html+='</p>';
  });
  html+='</div>';
  c.blanks.forEach(function(b,k){
    const sw=c.sents[b.sent].en.split(' '); sw[b.ti]='______';
    html+='<div class="mkQ"><div class="mkQHead"><b>'+(k+1)+'.</b> '+gmEsc(sw.join(' '))+'</div><div class="mkOpts">';
    b.options.forEach(function(o,oi){
      let cls='qOpt';
      if(c.done){ if(oi===b.ans) cls+=' right'; else if(c.answers[k]===oi) cls+=' wrong'; }
      else if(c.answers[k]===oi) cls+=' sel';
      html+='<button class="'+cls+'" data-k="'+k+'" data-oi="'+oi+'"><b>'+'ABCD'[oi]+'.</b> '+gmEsc(o)+'</button>';
    });
    html+='</div></div>';
  });
  html+='<div class="wBtns"><button class="wBtn reveal" id="c1Submit">'+(c.done?'✅ 已判分（答对 '+c.right+'/'+c.blanks.length+'）':'✓ 提交判分（每空 0.5 分，共 10 分）')+'</button></div>';
  st.innerHTML=html;
  st.querySelectorAll('.qOpt').forEach(function(btn){
    btn.onclick=function(){
      if(c1.done) return;
      const k=+btn.dataset.k, oi=+btn.dataset.oi;
      c1.answers[k]=oi;
      st.querySelectorAll('.qOpt[data-k="'+k+'"]').forEach(function(x){ x.classList.toggle('sel', +x.dataset.oi===oi); });
    };
  });
  document.getElementById('c1Submit').onclick=gradeCloze1;
}
function gradeCloze1(){
  if(!c1 || c1.done) return;
  c1.done=true; let right=0;
  c1.blanks.forEach(function(b,k){
    b.ok=c1.answers[k]===b.ans;
    if(b.ok) right++;
    else addWrong({type:'完形', prompt:'完形填空 · 第'+(k+1)+'空', body:c1.sents[b.sent].en,
                   options:b.options, ans:b.ans, yourIdx:c1.answers[k],
                   your:(c1.answers[k]!=null)?b.options[c1.answers[k]]:null, title:c1.passage.titleEn});
  });
  c1.right=right;
  renderCloze1();
  renderPanel();
  showToast('完形判分：答对 '+right+'/'+c1.blanks.length+'（每空 0.5 分，共 '+Math.round(right*0.5)+' 分）');
}
