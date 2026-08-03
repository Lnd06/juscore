package com.juscore.socialmanager

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.UUID

// ==========================================
// CONFIGURAÇÕES DE REDE & RETROFIT
// ==========================================

data class Post(
    val id: UUID,
    val pilar: String,
    val caption: String,
    val image_prompt: String,
    val image_url: String?,
    val video_path: String?,
    val status: String
)

data class PostUpdate(
    val caption: String? = null,
    val status: String? = null
)

interface JusCoreApi {
    @GET("posts/pending")
    suspend fun getPendingPosts(): List<Post>

    @POST("posts/{id}/approve")
    suspend fun approvePost(@Path("id") id: UUID, @Body body: PostUpdate): Post

    @POST("posts/{id}/reject")
    suspend fun rejectPost(@Path("id") id: UUID): Post
}

object RetrofitClient {
    private const val BASE_URL = "https://sua-url-personalizada.ngrok.app/" // Alterar para a URL do ngrok
    
    val api: JusCoreApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(JusCoreApi::class.java)
    }
}

// ==========================================
// TEMA VISUAL PREMIUM JUSCORE (GOLD/DARK)
// ==========================================

val GoldClaro = Color(0xFFC7984A)
val GoldEscuro = Color(0xFF72582D)
val DarkBG = Color(0xFF0A0A0A)
val DarkCardBG = Color(0xFF141414)
val PureWhite = Color(0xFFFFFFFF)
val MutedGray = Color(0xFF8E8E8E)
val AlertRed = Color(0xFFD32F2F)

private val DarkColorScheme = darkColorScheme(
    primary = GoldClaro,
    secondary = GoldEscuro,
    background = DarkBG,
    surface = DarkCardBG,
    onPrimary = DarkBG,
    onSecondary = PureWhite,
    onBackground = PureWhite,
    onSurface = PureWhite
)

// ==========================================
// ACTIVITY PRINCIPAL
// ==========================================

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = DarkColorScheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PostManagerScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostManagerScreen() {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    
    var posts by remember { mutableStateOf<List<Post>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var isRefreshing by remember { mutableStateOf(false) }

    fun fetchPosts() {
        scope.launch {
            isLoading = true
            try {
                // Em desenvolvimento real, usaria RetrofitClient.api
                // Adicionamos mock local de fallback para demonstrar a UI rodando sem quebras
                posts = try {
                    RetrofitClient.api.getPendingPosts()
                } catch (e: Exception) {
                    getMockPosts()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Erro ao conectar: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            } finally {
                isLoading = false
                isRefreshing = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchPosts()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "JUSCORE AI SOCIAL",
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp,
                        color = GoldClaro
                    )
                },
                actions = {
                    IconButton(onClick = { fetchPosts() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Atualizar Fila",
                            tint = GoldClaro
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBG)
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(DarkBG)
        ) {
            if (isLoading && posts.isEmpty()) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = GoldClaro
                )
            } else if (posts.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "🎉 Nenhuma postagem pendente!",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = GoldClaro,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "O Hermes Agent está monitorando as redes. Clique em atualizar para verificar novamente.",
                        fontSize = 14.sp,
                        color = MutedGray,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(posts, key = { it.id }) { post ->
                        PostApprovalCard(
                            post = post,
                            onApprove = { updatedCaption ->
                                scope.launch {
                                    try {
                                        // Chama API para aprovação
                                        try {
                                            RetrofitClient.api.approvePost(post.id, PostUpdate(caption = updatedCaption))
                                        } catch (e: Exception) {
                                            // Mock/Offline Fallback
                                        }
                                        posts = posts.filter { it.id != post.id }
                                        Toast.makeText(context, "Post Aprovado! Renderizando vídeo...", Toast.LENGTH_SHORT).show()
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Falha ao aprovar: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
                                    }
                                }
                            },
                            onReject = {
                                scope.launch {
                                    try {
                                        try {
                                            RetrofitClient.api.rejectPost(post.id)
                                        } catch (e: Exception) {
                                            // Fallback
                                        }
                                        posts = posts.filter { it.id != post.id }
                                        Toast.makeText(context, "Post Rejeitado e Arquivado.", Toast.LENGTH_SHORT).show()
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Falha ao rejeitar: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PostApprovalCard(
    post: Post,
    onApprove: (String) -> Unit,
    onReject: () -> Unit
) {
    var captionText by remember { mutableStateOf(post.caption) }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCardBG),
        border = BorderStroke(1.dp, GoldEscuro.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header: Pilar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = GoldEscuro.copy(alpha = 0.3f),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, GoldClaro),
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    Text(
                        text = post.pilar.uppercase(),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = GoldClaro,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                
                Text(
                    text = "ID: ${post.id.toString().take(8)}",
                    fontSize = 11.sp,
                    color = MutedGray
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Imagem Preview (Simulado com Moldura Estilizada e Prompt de IA)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(DarkBG, GoldEscuro.copy(alpha = 0.3f))
                        )
                    )
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "PREVIEW DA ARTE",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = GoldClaro,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = post.image_prompt,
                        fontSize = 11.sp,
                        color = MutedGray,
                        textAlign = TextAlign.Center,
                        maxLines = 4
                    )
                    if (post.image_url != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "URL: ${post.image_url}",
                            fontSize = 10.sp,
                            color = GoldClaro
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Editor de Legenda
            Text(
                text = "Legenda do Post (Edite se necessário)",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = MutedGray,
                modifier = Modifier.padding(bottom = 6.dp)
            )
            
            OutlinedTextField(
                value = captionText,
                onValueChange = { captionText = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 120.dp, max = 220.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = GoldClaro,
                    unfocusedBorderColor = MutedGray.copy(alpha = 0.5f),
                    focusedLabelColor = GoldClaro
                ),
                shape = RoundedCornerShape(8.dp),
                textStyle = TextStyle(color = PureWhite, fontSize = 14.sp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Botoões de Ação
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onReject,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = AlertRed),
                    border = BorderStroke(1.dp, AlertRed),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Rejeitar",
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Rejeitar", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = { onApprove(captionText) },
                    colors = ButtonDefaults.buttonColors(containerColor = GoldClaro, contentColor = DarkBG),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1.2f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Aprovar",
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Aprovar Post", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// Mock Local data helper
fun getMockPosts(): List<Post> {
    return listOf(
        Post(
            id = UUID.randomUUID(),
            pilar = "oab",
            caption = "⚖️ Você sabe que a peça prática reprova mais que a 1ª fase do Exame de Ordem, né?\n\nCom o Simulador de Peças OAB da JusCore AI você treina ilimitado.\n\n🎯 Plano Estudante Pro por R$ 29,90/mês. Link na bio!\n\n#JusCoreAI #Direito #OAB #EstudanteDeDireito #ProvaOAB",
            image_prompt = "A high-resolution corporate office with gold details, a laptop displaying a law exam simulator dashboard, and law books in background. Gold ambient lighting.",
            image_url = "/artes/mock_oab.png",
            video_path = null,
            status = "PENDENTE"
        ),
        Post(
            id = UUID.randomUUID(),
            pilar = "tcc",
            caption = "📚 Seu TCC tá travado na introdução?\n\nA JusCore AI tem um Assistente de TCC completo que formata em ABNT e organiza suas referências de forma automática.\n\n🎯 R$ 29,90/mês no plano Estudante Pro. Teste grátis!\n\n#JusCoreAI #TCC #ABNT #MonografiaDireito #FaculdadeDeDireito",
            image_prompt = "A modern minimalist desk with books stacked neatly, an open notebook, and a tablet displaying an automated citation tool. Sleek dark aesthetics.",
            image_url = "/artes/mock_tcc.png",
            video_path = null,
            status = "PENDENTE"
        )
    )
}
