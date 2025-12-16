import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

const PeopleAlsoBought = () => {
	const [recommendations, setRecommendations] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				// FIXED: Remove leading slash
				const res = await axios.get("products/recommendations");
				setRecommendations(res.data);
			} catch (error) {
				console.error("Error fetching recommendations:", error);
				toast.error(error.response?.data?.message || "Failed to load recommendations");
			} finally {
				setIsLoading(false);
			}
		};

		fetchRecommendations();
	}, []);

	if (isLoading) return <LoadingSpinner />;

	if (recommendations.length === 0) {
		return (
			<div className='mt-8'>
				<h3 className='text-2xl font-semibold text-emerald-400'>People also bought</h3>
				<p className='mt-4 text-gray-400'>No recommendations available at the moment.</p>
			</div>
		);
	}

	return (
		<div className='mt-8'>
			<h3 className='text-2xl font-semibold text-emerald-400'>People also bought</h3>
			<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{recommendations.map((product) => (
					<ProductCard key={product._id} product={product} />
				))}
			</div>
		</div>
	);
};

export default PeopleAlsoBought;
